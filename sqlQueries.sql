-- ============================================================
-- 15 SQL QUERIES  (varying complexities)
-- ============================================================


-- -------------------------------------------------------
-- Q1  (Simple SELECT – Projection)
-- List all available parts with their price.
-- -------------------------------------------------------
SELECT Item_ID, `Condition`, Price
FROM PART_ITEM
WHERE Status = 'Available';


-- -------------------------------------------------------
-- Q2  (WHERE + AND – Selection)
-- Find customers from Delhi who are currently active.
-- -------------------------------------------------------
SELECT Customer_ID, Name, Contact_No
FROM CUSTOMER
WHERE City = 'Delhi' AND Is_Active = TRUE;


-- -------------------------------------------------------
-- Q3  (ORDER BY + LIMIT)
-- Top 3 most expensive parts across all garages.
-- -------------------------------------------------------
SELECT Item_ID, Price, `Condition`, Status
FROM PART_ITEM
ORDER BY Price DESC
LIMIT 3;


-- -------------------------------------------------------
-- Q4  (INNER JOIN – two tables)
-- Show each part item along with its catalog info
-- (category, brand, model).
-- -------------------------------------------------------
SELECT PI.Item_ID, PC.Category, PC.Brand, PC.Model,
       PI.`Condition`, PI.Price, PI.Status
FROM PART_ITEM PI
INNER JOIN PART_CATALOG PC ON PI.Catalog_ID = PC.Catalog_ID;


-- -------------------------------------------------------
-- Q5  (Multi-table JOIN – three tables)
-- For every part, show the garage name and the
-- scrap dealer who owns that garage.
-- -------------------------------------------------------
SELECT PI.Item_ID, PC.Category, G.Name AS Garage,
       SD.Name AS Dealer, PI.Price
FROM PART_ITEM PI
JOIN PART_CATALOG PC ON PI.Catalog_ID = PC.Catalog_ID
JOIN GARAGE G         ON PI.Garage_ID  = G.Garage_ID
JOIN SCRAP_DEALER SD  ON G.Dealer_ID   = SD.Dealer_ID;


-- -------------------------------------------------------
-- Q6  (GROUP BY + Aggregate – COUNT)
-- How many parts does each garage currently hold?
-- -------------------------------------------------------
SELECT G.Name AS Garage, COUNT(PI.Item_ID) AS Total_Parts
FROM GARAGE G
LEFT JOIN PART_ITEM PI ON G.Garage_ID = PI.Garage_ID
GROUP BY G.Garage_ID, G.Name;


-- -------------------------------------------------------
-- Q7  (GROUP BY + HAVING)
-- Garages that have more than 2 parts.
-- -------------------------------------------------------
SELECT G.Name AS Garage, COUNT(PI.Item_ID) AS Part_Count
FROM GARAGE G
JOIN PART_ITEM PI ON G.Garage_ID = PI.Garage_ID
GROUP BY G.Garage_ID, G.Name
HAVING COUNT(PI.Item_ID) > 2;


-- -------------------------------------------------------
-- Q8  (Aggregate functions – SUM, AVG, MIN, MAX)
-- Overall price statistics of all parts in inventory.
-- -------------------------------------------------------
SELECT COUNT(*)        AS Total_Parts,
       SUM(Price)      AS Total_Value,
       AVG(Price)      AS Avg_Price,
       MIN(Price)      AS Cheapest,
       MAX(Price)      AS Most_Expensive
FROM PART_ITEM;


-- -------------------------------------------------------
-- Q9  (Subquery – scalar)
-- Parts priced above the average price.
-- -------------------------------------------------------
SELECT Item_ID, `Condition`, Price, Status
FROM PART_ITEM
WHERE Price > (SELECT AVG(Price) FROM PART_ITEM);


-- -------------------------------------------------------
-- Q10 (Subquery – IN / correlated)
-- Customers who have at least one completed booking.
-- -------------------------------------------------------
SELECT Customer_ID, Name, City
FROM CUSTOMER
WHERE Customer_ID IN (
    SELECT Customer_ID
    FROM BOOKING
    WHERE Booking_Status = 'Completed'
);


-- -------------------------------------------------------
-- Q11 (JOIN + GROUP BY – Value per dealer)
-- Total value of booked parts per scrap dealer.
-- -------------------------------------------------------
SELECT SD.Name AS Dealer, SUM(PI.Price) AS Total_Booked_Value
FROM BOOKING B
JOIN PART_ITEM PI    ON B.Item_ID     = PI.Item_ID
JOIN GARAGE G        ON PI.Garage_ID  = G.Garage_ID
JOIN SCRAP_DEALER SD ON G.Dealer_ID   = SD.Dealer_ID
WHERE B.Booking_Status = 'Completed'
GROUP BY SD.Dealer_ID, SD.Name
ORDER BY Total_Booked_Value DESC;


-- -------------------------------------------------------
-- Q12 (UNION – combining results)
-- Combined contact list of all scrap dealers and
-- customers (for a notification system, for example).
-- -------------------------------------------------------
SELECT Name, Contact_No, 'Dealer'   AS Role FROM SCRAP_DEALER
UNION
SELECT Name, Contact_No, 'Customer' AS Role FROM CUSTOMER;


-- -------------------------------------------------------
-- Q13 (UPDATE – data manipulation)
-- Mark a part as 'Sold' once its booking is completed.
-- (Updates the part booked in Booking_ID = 2)
-- -------------------------------------------------------
UPDATE PART_ITEM
SET Status = 'Sold'
WHERE Item_ID IN (
    SELECT Item_ID FROM BOOKING WHERE Booking_ID = 2
);

-- -------------------------------------------------------
-- Q15 (Complex – multi-join + CASE)
-- Booking report: for each booking show customer name,
-- part category, garage, dealer, part price, and a
-- price bracket label.
-- -------------------------------------------------------
SELECT C.Name   AS Customer,
       PC.Category,
       G.Name   AS Garage,
       SD.Name  AS Dealer,
       PI.Price,
       B.Booking_Status,
       CASE
           WHEN PI.Price < 5000  THEN 'Budget'
           WHEN PI.Price < 10000 THEN 'Mid-Range'
           ELSE 'Premium'
       END AS Price_Bracket
FROM BOOKING B
JOIN CUSTOMER C      ON B.Customer_ID  = C.Customer_ID
JOIN PART_ITEM PI    ON B.Item_ID      = PI.Item_ID
JOIN PART_CATALOG PC ON PI.Catalog_ID  = PC.Catalog_ID
JOIN GARAGE G        ON PI.Garage_ID   = G.Garage_ID
JOIN SCRAP_DEALER SD ON G.Dealer_ID    = SD.Dealer_ID;

-- -------------------------------------------------------
-- Q14 (UPDATE – re-release part on No-Show)
-- Set part status back to 'Available' if the booking
-- was a No-Show.
-- -------------------------------------------------------
UPDATE PART_ITEM
SET Status = 'Available'
WHERE Item_ID IN (
    SELECT Item_ID FROM BOOKING WHERE Booking_Status = 'No-Show'
);