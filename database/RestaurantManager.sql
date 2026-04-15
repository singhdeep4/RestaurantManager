-- ============================================
-- Restaurant Manager - Enhanced Database Schema
-- ============================================

DROP DATABASE IF EXISTS RestaurantDB;
CREATE DATABASE RestaurantDB;
USE RestaurantDB;

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE CUSTOMER (
    Customer_Id INT PRIMARY KEY AUTO_INCREMENT,
    Name        VARCHAR(50)  NOT NULL,
    Phone       VARCHAR(15)  NOT NULL UNIQUE,
    Email       VARCHAR(100) NOT NULL UNIQUE,
    Created_At  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customer_name (Name)
);

CREATE TABLE STAFF (
    Staff_Id   INT PRIMARY KEY AUTO_INCREMENT,
    Name       VARCHAR(50)  NOT NULL,
    Role       ENUM('Waiter','Cashier','Chef','Manager') NOT NULL DEFAULT 'Waiter',
    Phone      VARCHAR(15)  NOT NULL UNIQUE,
    Salary     DECIMAL(10,2) DEFAULT 0.00,
    Hire_Date  DATE         DEFAULT (CURRENT_DATE),
    Is_Active  BOOLEAN      DEFAULT TRUE,
    INDEX idx_staff_role (Role)
);

CREATE TABLE FOOD_ITEMS (
    Food_Id    INT PRIMARY KEY AUTO_INCREMENT,
    Food_Name  VARCHAR(100) NOT NULL UNIQUE,
    Price      DECIMAL(8,2) NOT NULL CHECK (Price > 0),
    Category   ENUM('Veg','Non-Veg','Beverage','Dessert') NOT NULL DEFAULT 'Veg',
    Is_Available BOOLEAN    DEFAULT TRUE,
    INDEX idx_food_category (Category)
);

CREATE TABLE ORDERS (
    Order_Id     INT PRIMARY KEY AUTO_INCREMENT,
    Order_Date   DATETIME    DEFAULT CURRENT_TIMESTAMP,
    Total_Amount DECIMAL(10,2) DEFAULT 0.00,
    Status       ENUM('Pending','Preparing','Served','Paid','Cancelled') DEFAULT 'Pending',
    Customer_Id  INT NOT NULL,
    Staff_Id     INT NOT NULL,
    FOREIGN KEY (Customer_Id) REFERENCES CUSTOMER(Customer_Id) ON DELETE RESTRICT,
    FOREIGN KEY (Staff_Id)    REFERENCES STAFF(Staff_Id)       ON DELETE RESTRICT,
    INDEX idx_order_date (Order_Date),
    INDEX idx_order_status (Status)
);

CREATE TABLE ORDER_DETAILS (
    Detail_Id  INT PRIMARY KEY AUTO_INCREMENT,
    Order_Id   INT NOT NULL,
    Food_Id    INT NOT NULL,
    Quantity   INT NOT NULL DEFAULT 1 CHECK (Quantity > 0),
    Unit_Price DECIMAL(8,2) NOT NULL,
    FOREIGN KEY (Order_Id) REFERENCES ORDERS(Order_Id)     ON DELETE CASCADE,
    FOREIGN KEY (Food_Id)  REFERENCES FOOD_ITEMS(Food_Id)  ON DELETE RESTRICT,
    UNIQUE KEY uq_order_food (Order_Id, Food_Id)
);

-- ============================================
-- VIEWS
-- ============================================

CREATE VIEW vw_order_summary AS
SELECT
    o.Order_Id,
    o.Order_Date,
    o.Total_Amount,
    o.Status,
    c.Name       AS Customer_Name,
    c.Phone      AS Customer_Phone,
    s.Name       AS Staff_Name,
    s.Role       AS Staff_Role
FROM ORDERS o
JOIN CUSTOMER c ON o.Customer_Id = c.Customer_Id
JOIN STAFF    s ON o.Staff_Id    = s.Staff_Id;

CREATE VIEW vw_order_detail_full AS
SELECT
    od.Detail_Id,
    od.Order_Id,
    f.Food_Name,
    f.Category,
    od.Quantity,
    od.Unit_Price,
    (od.Quantity * od.Unit_Price) AS Line_Total
FROM ORDER_DETAILS od
JOIN FOOD_ITEMS f ON od.Food_Id = f.Food_Id;

-- ============================================
-- TRIGGERS — auto-recalculate order total
-- ============================================

DELIMITER //

CREATE TRIGGER trg_after_insert_detail
AFTER INSERT ON ORDER_DETAILS
FOR EACH ROW
BEGIN
    UPDATE ORDERS
    SET Total_Amount = (
        SELECT COALESCE(SUM(Quantity * Unit_Price), 0)
        FROM ORDER_DETAILS WHERE Order_Id = NEW.Order_Id
    )
    WHERE Order_Id = NEW.Order_Id;
END //

CREATE TRIGGER trg_after_delete_detail
AFTER DELETE ON ORDER_DETAILS
FOR EACH ROW
BEGIN
    UPDATE ORDERS
    SET Total_Amount = (
        SELECT COALESCE(SUM(Quantity * Unit_Price), 0)
        FROM ORDER_DETAILS WHERE Order_Id = OLD.Order_Id
    )
    WHERE Order_Id = OLD.Order_Id;
END //

-- ============================================
-- STORED PROCEDURE — place a full order
-- ============================================

CREATE PROCEDURE sp_place_order(
    IN p_customer_id INT,
    IN p_staff_id    INT,
    IN p_items       JSON  -- e.g. [{"food_id":1,"quantity":2},{"food_id":3,"quantity":1}]
)
BEGIN
    DECLARE v_order_id INT;
    DECLARE v_i        INT DEFAULT 0;
    DECLARE v_len      INT;
    DECLARE v_food_id  INT;
    DECLARE v_qty      INT;
    DECLARE v_price    DECIMAL(8,2);

    SET v_len = JSON_LENGTH(p_items);

    START TRANSACTION;

    INSERT INTO ORDERS (Customer_Id, Staff_Id) VALUES (p_customer_id, p_staff_id);
    SET v_order_id = LAST_INSERT_ID();

    WHILE v_i < v_len DO
        SET v_food_id = JSON_EXTRACT(p_items, CONCAT('$[', v_i, '].food_id'));
        SET v_qty     = JSON_EXTRACT(p_items, CONCAT('$[', v_i, '].quantity'));

        SELECT Price INTO v_price FROM FOOD_ITEMS WHERE Food_Id = v_food_id;

        INSERT INTO ORDER_DETAILS (Order_Id, Food_Id, Quantity, Unit_Price)
        VALUES (v_order_id, v_food_id, v_qty, v_price);

        SET v_i = v_i + 1;
    END WHILE;

    COMMIT;

    SELECT v_order_id AS New_Order_Id;
END //

DELIMITER ;

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO CUSTOMER (Name, Phone, Email) VALUES
    ('Rahul',   '9876543210', 'rahul@mail.com'),
    ('Deep',    '9876543427', 'deep@mail.com'),
    ('Aryan',   '9876543734', 'aryan@mail.com'),
    ('Anuraag', '9876543123', 'anuraag@mail.com');

INSERT INTO STAFF (Name, Role, Phone, Salary) VALUES
    ('Amit',   'Waiter',  '9998887777', 18000.00),
    ('Sahili', 'Waiter',  '9998887123', 18000.00),
    ('Sam',    'Cashier', '9998887321', 20000.00);

INSERT INTO FOOD_ITEMS (Food_Name, Price, Category) VALUES
    ('Pizza',                250.00, 'Veg'),
    ('Chai',                  50.00, 'Beverage'),
    ('Biscuit',               10.00, 'Veg'),
    ('Poha',                  40.00, 'Veg'),
    ('Chicken Tikka Masala', 320.00, 'Non-Veg'),
    ('Tandoori Roti',         50.00, 'Veg'),
    ('Gulab Jamun',           60.00, 'Dessert'),
    ('Paneer Butter Masala', 280.00, 'Veg'),
    ('Cold Coffee',          120.00, 'Beverage'),
    ('Brownie',              150.00, 'Dessert');

-- Seed orders (trigger auto-calculates Total_Amount)
INSERT INTO ORDERS (Customer_Id, Staff_Id, Status) VALUES (1, 1, 'Paid');
INSERT INTO ORDER_DETAILS (Order_Id, Food_Id, Quantity, Unit_Price) VALUES (1, 1, 2, 250.00);

INSERT INTO ORDERS (Customer_Id, Staff_Id, Status) VALUES (2, 3, 'Paid');
INSERT INTO ORDER_DETAILS (Order_Id, Food_Id, Quantity, Unit_Price) VALUES (2, 2, 1, 50.00);
INSERT INTO ORDER_DETAILS (Order_Id, Food_Id, Quantity, Unit_Price) VALUES (2, 3, 1, 10.00);

INSERT INTO ORDERS (Customer_Id, Staff_Id, Status) VALUES (3, 2, 'Served');
INSERT INTO ORDER_DETAILS (Order_Id, Food_Id, Quantity, Unit_Price) VALUES (3, 4, 1, 40.00);

INSERT INTO ORDERS (Customer_Id, Staff_Id, Status) VALUES (4, 1, 'Paid');
INSERT INTO ORDER_DETAILS (Order_Id, Food_Id, Quantity, Unit_Price) VALUES (4, 5, 1, 320.00);
INSERT INTO ORDER_DETAILS (Order_Id, Food_Id, Quantity, Unit_Price) VALUES (4, 6, 2, 50.00);
