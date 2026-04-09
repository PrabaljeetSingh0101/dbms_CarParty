-- ============================================================
-- TASK 6: DATABASE TRANSACTIONS (Including Conflicting Ones)
-- ============================================================
-- 
-- HOW TO USE:
-- Open TWO separate terminals and connect to MariaDB in each:
--   Terminal 1:  mysql -u root -p AutoPartsDB
--   Terminal 2:  mysql -u root -p AutoPartsDB
--
-- Then follow the steps below. Run commands in the terminal
-- indicated (T1 = Terminal 1, T2 = Terminal 2).
-- The order matters! Follow step by step.
--
-- ============================================================


-- ============================================================
-- SCENARIO 1: DOUBLE BOOKING CONFLICT (Lost Update Problem)
-- ============================================================
-- Situation: Two customers try to book the SAME part at the
-- same time. Without proper locking, both would succeed and
-- the part would be "double booked" — a serious data error.
--
-- We show: How SELECT ... FOR UPDATE prevents this.
-- ============================================================

-- FIRST: Let's check which parts are available
-- (Run in either terminal)
SELECT Item_ID, Catalog_ID, `Condition`, Price, Status 
FROM PART_ITEM WHERE Status = 'Available';

-- Pick an Available Item_ID from the result (e.g., Item_ID = 3)
-- We will use Item_ID = 3 (Bumper, ₹8000) for this demo.

-- ──────────────────────────────────────────
-- STEP 1 [T1]: Customer 1 (Menka) starts a transaction
-- ──────────────────────────────────────────
START TRANSACTION;

-- She checks if the part is available and LOCKS the row
SELECT Item_ID, Status, Price 
FROM PART_ITEM 
WHERE Item_ID = 3 
FOR UPDATE;
-- Result: Status = 'Available' ✅
-- The row is now LOCKED by Terminal 1

-- ──────────────────────────────────────────
-- STEP 2 [T2]: Customer 2 (Savitri) also tries to book it
-- ──────────────────────────────────────────
START TRANSACTION;

-- She also tries to check and lock the same part
SELECT Item_ID, Status, Price 
FROM PART_ITEM 
WHERE Item_ID = 3 
FOR UPDATE;
-- ⏳ THIS WILL HANG/WAIT! Terminal 2 is blocked because
-- Terminal 1 already holds the lock on this row.
-- Savitri has to wait until Menka finishes.

-- ──────────────────────────────────────────
-- STEP 3 [T1]: Menka completes her booking
-- ──────────────────────────────────────────
-- Book the part
INSERT INTO BOOKING (Booking_Date, Booking_Time, Customer_ID, Item_ID)
VALUES ('2026-04-15', '10:00:00', 1, 3);
-- The trigger Auto_Book_Part_Item fires and sets Status = 'Booked'

COMMIT;
-- Lock is released! Now Terminal 2 unblocks.

-- ──────────────────────────────────────────
-- STEP 4 [T2]: Savitri's SELECT finally returns
-- ──────────────────────────────────────────
-- Her SELECT now returns: Status = 'Booked' ❌
-- She sees the part is NO LONGER available!
-- So her application can show an error: "Part already booked"

ROLLBACK;
-- Savitri's transaction is cancelled. No double booking! ✅

-- VERIFY: Check the part status
SELECT Item_ID, Status FROM PART_ITEM WHERE Item_ID = 3;
-- Result: Status = 'Booked' — only ONE booking exists.

SELECT * FROM BOOKING WHERE Item_ID = 3 ORDER BY Booking_ID DESC LIMIT 2;
-- Result: Only Menka's booking exists. No duplicate!


-- ============================================================
-- SCENARIO 2: DEADLOCK (Two transactions block each other)
-- ============================================================
-- Situation: Transaction 1 locks Part A, then tries to lock Part B.
--            Transaction 2 locks Part B, then tries to lock Part A.
--            Neither can proceed → DEADLOCK!
--            MariaDB detects this and kills one transaction.
--
-- First, let's make sure we have 2 available parts:
-- ============================================================

-- SETUP: Reset two parts to Available for this demo
UPDATE PART_ITEM SET Status = 'Available' WHERE Item_ID IN (5, 6);

-- ──────────────────────────────────────────
-- STEP 1 [T1]: Transaction A locks Part 5
-- ──────────────────────────────────────────
START TRANSACTION;

SELECT * FROM PART_ITEM WHERE Item_ID = 5 FOR UPDATE;
-- ✅ T1 now holds lock on Part 5

-- ──────────────────────────────────────────
-- STEP 2 [T2]: Transaction B locks Part 6
-- ──────────────────────────────────────────
START TRANSACTION;

SELECT * FROM PART_ITEM WHERE Item_ID = 6 FOR UPDATE;
-- ✅ T2 now holds lock on Part 6

-- ──────────────────────────────────────────
-- STEP 3 [T1]: Transaction A now wants Part 6 too
-- ──────────────────────────────────────────
SELECT * FROM PART_ITEM WHERE Item_ID = 6 FOR UPDATE;
-- ⏳ WAITING... T2 holds this lock

-- ──────────────────────────────────────────
-- STEP 4 [T2]: Transaction B now wants Part 5 too
-- ──────────────────────────────────────────
SELECT * FROM PART_ITEM WHERE Item_ID = 5 FOR UPDATE;
-- 💀 DEADLOCK DETECTED!
-- ERROR 1213 (40001): Deadlock found when trying to get lock;
-- try restarting transaction
--
-- MariaDB automatically kills THIS transaction (the victim)
-- and lets Terminal 1's transaction proceed!

-- ──────────────────────────────────────────
-- STEP 5 [T1]: Transaction A succeeds (it was unblocked)
-- ──────────────────────────────────────────
-- T1's SELECT on Part 6 now returns successfully
UPDATE PART_ITEM SET Status = 'Booked' WHERE Item_ID IN (5, 6);
COMMIT;
-- ✅ Transaction A completed. Transaction B was rolled back.

-- VERIFY:
SELECT Item_ID, Status FROM PART_ITEM WHERE Item_ID IN (5, 6);
-- Both parts are Booked by Transaction A


-- ============================================================
-- SCENARIO 3: ROLLBACK ON ERROR (Atomic Transaction)
-- ============================================================
-- Situation: A dealer wants to add a new garage AND a new part
-- in one transaction. But the part insert fails (bad Catalog_ID).
-- The entire transaction should roll back — no partial data.
-- ============================================================

-- ──────────────────────────────────────────
-- Run in any terminal:
-- ──────────────────────────────────────────

-- Check current garage count
SELECT COUNT(*) AS garages_before FROM GARAGE;

START TRANSACTION;

-- Step 1: Add a new garage (this succeeds)
INSERT INTO GARAGE (Name, Location, Dealer_ID) 
VALUES ('Test Garage', 'Test City', 1);

-- Verify it exists inside the transaction
SELECT * FROM GARAGE WHERE Name = 'Test Garage';
-- Result: 1 row ✅ (visible inside this transaction)

-- Step 2: Add a part with INVALID Catalog_ID (this FAILS)
INSERT INTO PART_ITEM (Catalog_ID, Garage_ID, `Condition`, Price, Status)
VALUES (99999, 1, 'Good', 5000.00, 'Available');
-- ERROR! Foreign key constraint fails because Catalog_ID 99999 
-- does not exist in PART_CATALOG

-- Because of the error, we ROLLBACK everything
ROLLBACK;

-- Verify: The garage was NOT added (rolled back)
SELECT COUNT(*) AS garages_after FROM GARAGE;
SELECT * FROM GARAGE WHERE Name = 'Test Garage';
-- Result: 0 rows! The garage insert was undone. ✅
-- This proves ATOMICITY — all or nothing.


-- ============================================================
-- SCENARIO 4: READ COMMITTED vs REPEATABLE READ (Isolation)
-- ============================================================
-- Situation: Show how transaction isolation levels affect
-- what one transaction can see while another is modifying data.
-- ============================================================

-- SETUP
UPDATE PART_ITEM SET Price = 45000 WHERE Item_ID = 1;

-- ──────────────────────────────────────────
-- STEP 1 [T1]: Start a transaction and read the price
-- ──────────────────────────────────────────
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;

SELECT Item_ID, Price FROM PART_ITEM WHERE Item_ID = 1;
-- Result: Price = 45000

-- ──────────────────────────────────────────
-- STEP 2 [T2]: Another user updates the price and commits
-- ──────────────────────────────────────────
START TRANSACTION;
UPDATE PART_ITEM SET Price = 99999 WHERE Item_ID = 1;
COMMIT;
-- Price is now 99999 in the database

-- ──────────────────────────────────────────
-- STEP 3 [T1]: Read the price again (same transaction)
-- ──────────────────────────────────────────
SELECT Item_ID, Price FROM PART_ITEM WHERE Item_ID = 1;
-- Result: Price = 45000 (STILL the old value!)
-- REPEATABLE READ ensures consistent reads within a transaction.
-- T1 does NOT see T2's committed change.

COMMIT;

-- ──────────────────────────────────────────
-- STEP 4 [T1]: Now read outside any transaction
-- ──────────────────────────────────────────
SELECT Item_ID, Price FROM PART_ITEM WHERE Item_ID = 1;
-- Result: Price = 99999 (NOW it sees the update)

-- CLEANUP: Reset price
UPDATE PART_ITEM SET Price = 45000 WHERE Item_ID = 1;


-- ============================================================
-- CLEANUP: Reset data back to original state after demos
-- ============================================================
UPDATE PART_ITEM SET Status = 'Available' WHERE Item_ID = 3;
UPDATE PART_ITEM SET Status = 'Available' WHERE Item_ID = 5;
UPDATE PART_ITEM SET Status = 'Available' WHERE Item_ID = 6;
UPDATE PART_ITEM SET Price = 45000 WHERE Item_ID = 1;
-- Delete any test bookings we created
DELETE FROM BOOKING WHERE Booking_Date = '2026-04-15' AND Item_ID = 3;
