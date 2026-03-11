# 🔍 DBMS Project Review — Used Auto Parts System

A comprehensive deep-dive into your current schema, identifying **loopholes, design flaws, missing features**, and **creative ideas** to turn this into a production-grade, real-world-class system.

---

## 1. 🚨 Critical Loopholes & Design Flaws in Current Schema

These are things that are **broken or dangerous** right now.

### 1.1 No Inventory Table — Your Instructor is Right

Your current design stores `Garage_ID` directly in the `PART` table. This means:

| Problem | Why it matters |
|---|---|
| **A part can only ever be at ONE garage** | Real world: garages restock the *same type* of part. You have 10 brake pads at Garage A and 5 at Garage B — your schema can't represent quantities at all. |
| **No concept of "quantity"** | Each physical item needs its own `Part_ID` row. Want 50 identical brake pads? You need 50 rows with 50 different Part IDs. That's insane at scale. |
| **Sold parts disappear or stay as ghosts** | Once a part is sold, its `Status` changes to `Sold` but it still occupies a row forever. No audit trail, no history. |

> [!CAUTION]
> **This is the #1 architectural flaw.** Amazon doesn't create a new SKU for every single copy of the same book. They have a Product catalog + an Inventory table with quantities per warehouse. You need the same separation.

**Fix:** Split into `PART_CATALOG` (describes a type of part) + `INVENTORY` (tracks quantity per garage per catalog item).

```sql
-- What a part IS (catalog)
CREATE TABLE PART_CATALOG (
    Catalog_ID   INT PRIMARY KEY AUTO_INCREMENT,
    Category     VARCHAR(50) NOT NULL,
    Brand        VARCHAR(50),
    Model        VARCHAR(50),
    Year_Start   INT,
    Year_End     INT,           -- ← supports year RANGES, not a single year
    Condition    VARCHAR(20),
    Price        DECIMAL(10,2) CHECK (Price > 0),
    Dealer_ID    INT NOT NULL,
    FOREIGN KEY (Dealer_ID) REFERENCES SCRAP_DEALER(Dealer_ID)
);

-- How many of that part exist at each garage
CREATE TABLE INVENTORY (
    Inventory_ID   INT PRIMARY KEY AUTO_INCREMENT,
    Catalog_ID     INT NOT NULL,
    Garage_ID      INT NOT NULL,
    Quantity       INT NOT NULL DEFAULT 0 CHECK (Quantity >= 0),
    Reorder_Level  INT DEFAULT 5,    -- ← alerts when stock drops below this
    Last_Restocked DATETIME,
    FOREIGN KEY (Catalog_ID) REFERENCES PART_CATALOG(Catalog_ID),
    FOREIGN KEY (Garage_ID) REFERENCES GARAGE(Garage_ID),
    UNIQUE (Catalog_ID, Garage_ID)   -- one row per part-per-garage
);
```

### 1.2 Booking a Part Locks It Forever (1:1 Constraint Bug)

```sql
UNIQUE (Part_ID)  -- in BOOKING table
```

This means **one Part_ID can only ever appear in ONE booking in history**. If a customer cancels or no-shows, that part can **never be booked again** because the UNIQUE constraint already has that Part_ID. This is a showstopper bug.

> [!WARNING]
> A "No-Show" booking on Part 1003 means Part 1003 can literally **never be re-booked** in your system, even though it's still available.

**Fix:** Remove the UNIQUE constraint. Instead, enforce "only one *active* booking per part" via application logic or a partial unique index/trigger.

### 1.3 `ON DELETE CASCADE` is Dangerous

If a scrap dealer is deleted, **ALL their parts vanish**. If a customer is deleted, **ALL their bookings vanish**. In a real system, you never lose historical data.

**Fix:** Use `ON DELETE RESTRICT` or soft-deletes (an `is_active` flag).

### 1.4 No AUTO_INCREMENT on Primary Keys

All IDs are manually inserted (`1`, `101`, `201`, `1001`). In production, this causes:
- Collision errors when two users insert simultaneously
- Manual bookkeeping of "what's the next ID?"

**Fix:** Use `AUTO_INCREMENT` on all primary keys.

### 1.5 Year Is a Single Value, Not a Range

Your description says: *"compatible manufacturing year range"*. But `Year INT` stores only one year. A brake pad for a 2018–2022 Honda City should match all those years.

**Fix:** Use `Year_Start` and `Year_End` columns as shown in the catalog table above.

---

## 2. 🧱 Structural Improvements (Making it Solid)

### 2.1 Add a `TRANSACTION` / `SALES` Table

Your system has bookings but **no record of actual sales**. When does money exchange hands? What was the final price? Was there a discount?

```sql
CREATE TABLE SALE (
    Sale_ID       INT PRIMARY KEY AUTO_INCREMENT,
    Booking_ID    INT NOT NULL,
    Sale_Date     DATETIME DEFAULT CURRENT_TIMESTAMP,
    Final_Price   DECIMAL(10,2) NOT NULL,
    Payment_Mode  VARCHAR(20) CHECK (Payment_Mode IN ('Cash','UPI','Card','Online')),
    FOREIGN KEY (Booking_ID) REFERENCES BOOKING(Booking_ID)
);
```

### 2.2 Add Proper Timestamps Everywhere

No table has `created_at` or `updated_at` timestamps. This means:
- No audit trail
- No way to analyze trends over time
- No way to debug issues

**Add to every table:**
```sql
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### 2.3 Customer Address Should Be a Separate Table

A customer can have multiple addresses (home, work, shipping). Storing just `City` is very limiting.

```sql
CREATE TABLE CUSTOMER_ADDRESS (
    Address_ID    INT PRIMARY KEY AUTO_INCREMENT,
    Customer_ID   INT NOT NULL,
    Address_Line  VARCHAR(200),
    City          VARCHAR(50),
    State         VARCHAR(50),
    Pincode       VARCHAR(10),
    Is_Default    BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID)
);
```

### 2.4 Add a `VEHICLE` Table for Customer's Cars

Your description says *"A customer may book parts for **multiple vehicles**"*. But there's no Vehicle table! How do you know which car the customer needs the part for?

```sql
CREATE TABLE VEHICLE (
    Vehicle_ID    INT PRIMARY KEY AUTO_INCREMENT,
    Customer_ID   INT NOT NULL,
    Brand         VARCHAR(50),
    Model         VARCHAR(50),
    Year          INT,
    Reg_Number    VARCHAR(20),
    FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID)
);
```

Then link bookings to vehicles:
```sql
ALTER TABLE BOOKING ADD COLUMN Vehicle_ID INT REFERENCES VEHICLE(Vehicle_ID);
```

---

## 3. 💡 Creative & Smart Features (Next-Level Ideas)

These are the features that make evaluators go **"wow, nobody else did this."**

### 3.1 🧠 Smart Part Compatibility Engine

Instead of exact matches, build a **compatibility matrix**:

```sql
CREATE TABLE COMPATIBILITY (
    Compat_ID     INT PRIMARY KEY AUTO_INCREMENT,
    Catalog_ID    INT NOT NULL,
    Brand         VARCHAR(50),
    Model         VARCHAR(50),
    Year_Start    INT,
    Year_End      INT,
    Fit_Type      VARCHAR(20) CHECK (Fit_Type IN ('Exact','Compatible','Universal')),
    FOREIGN KEY (Catalog_ID) REFERENCES PART_CATALOG(Catalog_ID)
);
```

Now a single brake pad can be marked compatible with Honda City 2018–2022 **AND** Honda Amaze 2019–2023. This is how real auto parts databases (like AutoZone, RockAuto) work.

### 3.2 📊 Automatic Low-Stock Alerts (Trigger-Based)

```sql
DELIMITER //
CREATE TRIGGER trg_low_stock_alert
AFTER UPDATE ON INVENTORY
FOR EACH ROW
BEGIN
    IF NEW.Quantity <= NEW.Reorder_Level AND OLD.Quantity > OLD.Reorder_Level THEN
        INSERT INTO ALERTS (Garage_ID, Catalog_ID, Alert_Type, Message, Created_At)
        VALUES (NEW.Garage_ID, NEW.Catalog_ID, 'LOW_STOCK',
                CONCAT('Stock dropped to ', NEW.Quantity, ' units'),
                NOW());
    END IF;
END//
DELIMITER ;
```

This is mentioned in your project scope but **not implemented at all**. Adding triggers makes it production-real.

### 3.3 📈 Price History Tracking

Prices change over time. Track historical prices for analytics:

```sql
CREATE TABLE PRICE_HISTORY (
    History_ID    INT PRIMARY KEY AUTO_INCREMENT,
    Catalog_ID    INT NOT NULL,
    Old_Price     DECIMAL(10,2),
    New_Price     DECIMAL(10,2),
    Changed_At    DATETIME DEFAULT CURRENT_TIMESTAMP,
    Changed_By    INT,  -- who changed it
    FOREIGN KEY (Catalog_ID) REFERENCES PART_CATALOG(Catalog_ID)
);
```

### 3.4 ⭐ Customer Reviews & Ratings

Let customers rate parts and garages — this is what makes platforms like Amazon and Zomato sticky:

```sql
CREATE TABLE REVIEW (
    Review_ID     INT PRIMARY KEY AUTO_INCREMENT,
    Customer_ID   INT NOT NULL,
    Garage_ID     INT,
    Catalog_ID    INT,
    Rating        INT CHECK (Rating BETWEEN 1 AND 5),
    Comment       TEXT,
    Created_At    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID),
    FOREIGN KEY (Garage_ID) REFERENCES GARAGE(Garage_ID),
    FOREIGN KEY (Catalog_ID) REFERENCES PART_CATALOG(Catalog_ID)
);
```

### 3.5 🔔 Wishlist / "Notify Me When Available"

Customer wants a part that's currently out of stock? Let them subscribe:

```sql
CREATE TABLE WISHLIST (
    Wishlist_ID   INT PRIMARY KEY AUTO_INCREMENT,
    Customer_ID   INT NOT NULL,
    Category      VARCHAR(50),
    Brand         VARCHAR(50),
    Model         VARCHAR(50),
    Year          INT,
    Notified      BOOLEAN DEFAULT FALSE,
    Created_At    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID)
);
```

When matching inventory is added, a trigger can auto-flag `Notified = TRUE`. **No real-world auto parts app does this well — this is your differentiator.**

### 3.6 🚚 Part Transfer Between Garages

Real warehouse systems let you transfer inventory between locations:

```sql
CREATE TABLE TRANSFER (
    Transfer_ID       INT PRIMARY KEY AUTO_INCREMENT,
    Catalog_ID        INT NOT NULL,
    From_Garage_ID    INT NOT NULL,
    To_Garage_ID      INT NOT NULL,
    Quantity          INT NOT NULL,
    Transfer_Status   VARCHAR(20) CHECK (Transfer_Status IN ('Pending','In-Transit','Completed')),
    Initiated_At      DATETIME DEFAULT CURRENT_TIMESTAMP,
    Completed_At      DATETIME,
    FOREIGN KEY (Catalog_ID) REFERENCES PART_CATALOG(Catalog_ID),
    FOREIGN KEY (From_Garage_ID) REFERENCES GARAGE(Garage_ID),
    FOREIGN KEY (To_Garage_ID) REFERENCES GARAGE(Garage_ID)
);
```

### 3.7 🏷️ Discount / Coupon System

```sql
CREATE TABLE COUPON (
    Coupon_ID     INT PRIMARY KEY AUTO_INCREMENT,
    Code          VARCHAR(20) UNIQUE NOT NULL,
    Discount_Pct  DECIMAL(5,2) CHECK (Discount_Pct BETWEEN 0 AND 100),
    Valid_From    DATE,
    Valid_Until   DATE,
    Max_Uses      INT DEFAULT 1,
    Times_Used    INT DEFAULT 0
);
```

### 3.8 📋 Audit Log (Who Did What, When)

```sql
CREATE TABLE AUDIT_LOG (
    Log_ID        INT PRIMARY KEY AUTO_INCREMENT,
    Table_Name    VARCHAR(50),
    Record_ID     INT,
    Action        VARCHAR(10) CHECK (Action IN ('INSERT','UPDATE','DELETE')),
    Old_Values    JSON,
    New_Values    JSON,
    Performed_By  INT,
    Performed_At  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

This is enterprise-grade. Every real production system has audit logging.

---

## 4. 🔧 Smart Queries to Showcase (Demo-Ready)

These are **impressive queries** you can include for your presentation:

### 4.1 Find compatible parts across all garages with stock
```sql
SELECT pc.Category, pc.Brand, pc.Model, g.Name AS Garage, 
       i.Quantity, pc.Price
FROM PART_CATALOG pc
JOIN INVENTORY i ON pc.Catalog_ID = i.Catalog_ID
JOIN GARAGE g ON i.Garage_ID = g.Garage_ID
WHERE pc.Brand = 'Honda' AND pc.Model = 'City'
  AND 2019 BETWEEN pc.Year_Start AND pc.Year_End
  AND i.Quantity > 0
ORDER BY pc.Price ASC;
```

### 4.2 Daily sales report per garage
```sql
SELECT g.Name, DATE(s.Sale_Date) AS Day, 
       COUNT(*) AS Parts_Sold, SUM(s.Final_Price) AS Revenue
FROM SALE s
JOIN BOOKING b ON s.Booking_ID = b.Booking_ID
JOIN PART_CATALOG pc ON b.Catalog_ID = pc.Catalog_ID
JOIN INVENTORY i ON pc.Catalog_ID = i.Catalog_ID
JOIN GARAGE g ON i.Garage_ID = g.Garage_ID
GROUP BY g.Name, DATE(s.Sale_Date)
ORDER BY Day DESC;
```

### 4.3 Customer lifetime value (Top buyers)
```sql
SELECT c.Name, COUNT(s.Sale_ID) AS Total_Purchases,
       SUM(s.Final_Price) AS Total_Spent
FROM CUSTOMER c
JOIN BOOKING b ON c.Customer_ID = b.Customer_ID
JOIN SALE s ON b.Booking_ID = s.Booking_ID
GROUP BY c.Customer_ID
ORDER BY Total_Spent DESC
LIMIT 10;
```

### 4.4 No-show rate per customer (flag unreliable customers)
```sql
SELECT c.Name,
       COUNT(*) AS Total_Bookings,
       SUM(CASE WHEN b.Booking_Status = 'No-Show' THEN 1 ELSE 0 END) AS NoShows,
       ROUND(SUM(CASE WHEN b.Booking_Status = 'No-Show' THEN 1 ELSE 0 END) * 100.0 
             / COUNT(*), 1) AS NoShow_Pct
FROM CUSTOMER c
JOIN BOOKING b ON c.Customer_ID = b.Customer_ID
GROUP BY c.Customer_ID
HAVING NoShow_Pct > 30;
```

### 4.5 Parts that have never been booked (dead inventory)
```sql
SELECT pc.Category, pc.Brand, pc.Model, i.Quantity, 
       DATEDIFF(NOW(), i.Last_Restocked) AS Days_Sitting
FROM PART_CATALOG pc
JOIN INVENTORY i ON pc.Catalog_ID = i.Catalog_ID
LEFT JOIN BOOKING b ON pc.Catalog_ID = b.Catalog_ID
WHERE b.Booking_ID IS NULL
ORDER BY Days_Sitting DESC;
```

---

## 5. 📊 Summary: Current vs. Proposed

| Aspect | Current (❌) | Proposed (✅) |
|--------|-------------|--------------|
| Inventory tracking | Part has Garage_ID (no quantities) | Separate `INVENTORY` table with quantities |
| Re-booking after cancel | Impossible (UNIQUE constraint) | Allowed with proper status management |
| Year compatibility | Single year only | Year range (Start–End) |
| Sales tracking | None | Full `SALE` table with payment info |
| Audit trail | None | `AUDIT_LOG` + timestamps everywhere |
| Customer vehicles | Not tracked | `VEHICLE` table linked to bookings |
| Stock alerts | Mentioned but not done | Triggers on `INVENTORY` |
| Reviews & ratings | None | `REVIEW` table |
| Cross-garage transfers | Not possible | `TRANSFER` table |
| Price changes | Lost forever | `PRICE_HISTORY` table |
| Wishlists | None | `WISHLIST` with auto-notify |
| Discounts | None | `COUPON` system |
| Data deletion | Cascade deletes everything | Soft deletes, preserve history |

---

## 6. 🎯 Prioritized Roadmap

What to do and in which order:

| Priority | What | Impact |
|----------|------|--------|
| **P0 — Do First** | Add `INVENTORY` table, split `PART` into catalog | Fixes the core architectural flaw |
| **P0 — Do First** | Fix booking 1:1 bug | Currently broken for re-bookings |
| **P1 — High** | Add `VEHICLE` table | Required by your own spec |
| **P1 — High** | Add `SALE` table | Completes the booking lifecycle |
| **P1 — High** | Add timestamps everywhere | Basic production requirement |
| **P2 — Medium** | Low-stock triggers + `ALERTS` | Impressive for demo |
| **P2 — Medium** | `COMPATIBILITY` matrix | Smart search feature |
| **P2 — Medium** | `PRICE_HISTORY` | Shows data maturity |
| **P3 — Creative** | Reviews, Wishlists, Coupons, Transfers | Wow-factor features |
| **P3 — Creative** | `AUDIT_LOG` | Enterprise-grade touch |

> [!TIP]
> Even implementing just P0 + P1 will make your project significantly more professional. P2 and P3 are what separate an A-grade project from an A+ project.
