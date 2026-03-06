  
**PRODUCT REQUIREMENTS DOCUMENT**

Universal Renting & Booking System – SaaS Platform

Version: 1.0 (MVP)

Status: Draft

Date: March 2026

# **Table of Contents**

# **1\. Executive Summary**

This document serves as the Product Requirements Document (PRD) for the development of a Universal Renting & Booking System SaaS platform. The platform is designed as a multi-tenant solution that helps rental business owners manage bookings for both facilities and physical items digitally, with integrated payment processing.

For the MVP (Minimum Viable Product) phase, the platform will support two primary use cases: internet cafe (warnet) facility rentals based on time slots and physical camera equipment rentals based on rental duration. The platform employs a BYOK (Bring Your Own Key) mechanism for Mayar.id payment gateway integration, allowing each merchant to use their own payment account.

# **2\. Background and Objectives**

## **2.1 Background**

Many small-to-medium rental business owners (SMEs), such as internet cafe operators and camera rental shops, still manage bookings manually. This leads to operational inefficiencies, double-booking risks, and difficulties in tracking transactions and payments.

## **2.2 Product Objectives**

* Provide a flexible booking platform that accommodates various types of rental businesses.

* Automate real-time availability checking to prevent double bookings.

* Integrate digital payments via Mayar.id using the BYOK mechanism.

* Deliver a seamless booking experience for customers through a public storefront without requiring registration.

* Provide a customer portal with magic link authentication for accessing transaction history.

# **3\. MVP Scope**

## **3.1 Supported Use Cases**

The MVP will support the following two use cases:

| Use Case | Description |
| :---- | :---- |
| **Internet Cafe Facility Rental** | Time-slot-based booking of rooms/PCs (hourly). Each room has specific capacity and hardware specifications. |
| **Camera Equipment Rental** | Duration-based rental of camera units (hourly/daily). Each unit has a serial number and associated accessories. |

## **3.2 Core System Components**

* Public Storefront: catalog browsing and checkout page without login (guest checkout).

* Customer Portal: transaction history access via magic link authentication.

* Merchant Admin Panel: dashboard for managing business operations, catalog, orders, promotions, and settings.

* Payment Gateway Integration: Mayar.id with BYOK mechanism.

* Webhook Listener: endpoint to receive automatic payment confirmation from Mayar.id.

# **4\. User Actors**

| Actor | Description | Access |
| :---- | :---- | :---- |
| **Customer** | Facility/item renter | Public storefront and Customer Portal (magic link) |
| **Merchant Owner** | Rental business owner | Admin Panel with full access |
| **Merchant Admin** | Operational staff | Admin Panel with role-based restricted access (ADMIN/STAFF) |

# **5\. Database Architecture**

The database uses MySQL with a Single Table Inheritance approach and JSON columns for dynamic attributes. All tables use UUID (CHAR(36)) as their Primary Key to support future scalability and migration. The design complies with Third Normal Form (3NF) standards, with planned exceptions for JSON columns (dynamic attributes) and price snapshots on transactions.

### **5.1 merchants**

| Column | Data Type | Description |
| :---- | :---- | :---- |
| **id** | CHAR(36) PK | Unique merchant UUID |
| **name** | VARCHAR(255) | Business/store name |
| **mayar\_api\_key\_encrypted** | TEXT | Mayar.id API Key (must be AES-256 encrypted) |
| **created\_at** | TIMESTAMP | Record creation timestamp |
| **updated\_at** | TIMESTAMP | Last update timestamp (auto-update) |

### **5.2 merchant\_users**

| Column | Data Type | Description |
| :---- | :---- | :---- |
| **id** | CHAR(36) PK | Unique admin user UUID |
| **merchant\_id** | CHAR(36) FK | Reference to merchants table |
| **email** | VARCHAR(255) UNIQUE | Email for dashboard login |
| **password\_hash** | VARCHAR(255) | Password hash (bcrypt) |
| **full\_name** | VARCHAR(255) | Full name of the user |
| **role** | ENUM | Role: OWNER, ADMIN, or STAFF |
| **created\_at** | TIMESTAMP | Record creation timestamp |
| **updated\_at** | TIMESTAMP | Last update timestamp |

### **5.3 customers**

| Column | Data Type | Description |
| :---- | :---- | :---- |
| **id** | CHAR(36) PK | Unique customer UUID |
| **merchant\_id** | CHAR(36) FK | Reference to merchants table (multi-tenancy) |
| **name** | VARCHAR(255) | Customer full name |
| **email** | VARCHAR(255) | Customer email (UNIQUE per merchant) |
| **phone\_number** | VARCHAR(50) | Phone/WhatsApp number |
| **created\_at** | TIMESTAMP | Record creation timestamp |
| **updated\_at** | TIMESTAMP | Last update timestamp |

### **5.4 magic\_links**

| Column | Data Type | Description |
| :---- | :---- | :---- |
| **id** | CHAR(36) PK | Unique token UUID |
| **customer\_id** | CHAR(36) FK | Reference to customers table |
| **token** | VARCHAR(255) UNIQUE | Cryptographically random token |
| **expires\_at** | DATETIME | Expiration time (15 minutes) |
| **is\_used** | BOOLEAN | Token usage status (default: FALSE) |
| **created\_at** | TIMESTAMP | Token creation timestamp |

### **5.5 assets**

| Column | Data Type | Description |
| :---- | :---- | :---- |
| **id** | CHAR(36) PK | Unique asset/inventory UUID |
| **merchant\_id** | CHAR(36) FK | Reference to merchants table |
| **type** | ENUM | Type: ROOM or PHYSICAL\_ITEM |
| **name** | VARCHAR(255) | Item name (e.g., VIP Room, Sony A7III) |
| **base\_price** | DECIMAL(10,2) | Base rental price |
| **price\_unit** | ENUM | Price unit: HOUR or DAY |
| **attributes** | JSON | Dynamic attributes (PC specs, camera lens, etc.) |

### **5.6 asset\_units**

| Column | Data Type | Description |
| :---- | :---- | :---- |
| **id** | CHAR(36) PK | Unique physical unit UUID |
| **asset\_id** | CHAR(36) FK | Reference to assets table |
| **identifier** | VARCHAR(100) | Identification number (PC-01, Serial Number) |
| **status** | ENUM | Status: AVAILABLE, MAINTENANCE, or BROKEN |

### **5.7 bookings**

| Column | Data Type | Description |
| :---- | :---- | :---- |
| **id** | CHAR(36) PK | Unique booking UUID |
| **merchant\_id** | CHAR(36) FK | Reference to merchants table |
| **customer\_id** | CHAR(36) FK | Reference to customers table |
| **asset\_unit\_id** | CHAR(36) FK | Reference to asset\_units table |
| **promo\_code\_id** | CHAR(36) FK NULL | Reference to promo\_codes table (optional) |
| **start\_time** | DATETIME | Rental start time |
| **end\_time** | DATETIME | Rental end time |
| **total\_price** | DECIMAL(10,2) | Final price after discount (snapshot) |
| **upfront\_fee** | DECIMAL(10,2) | Upfront payment (deposit) amount |
| **discount\_amount** | DECIMAL(10,2) | Applied promo discount amount (default: 0\) |
| **status** | ENUM | PENDING\_PAYMENT, CONFIRMED, ACTIVE, COMPLETED, CANCELLED |

### **5.8 payments**

| Column | Data Type | Description |
| :---- | :---- | :---- |
| **id** | CHAR(36) PK | Unique payment UUID |
| **booking\_id** | CHAR(36) FK | Reference to bookings table |
| **mayar\_transaction\_id** | VARCHAR(255) | Transaction ID from Mayar.id |
| **payment\_link** | VARCHAR(255) | Mayar.id payment link |
| **amount** | DECIMAL(10,2) | Payment amount |
| **status** | ENUM | UNPAID, PAID, FAILED, or REFUNDED |

### **5.9 promo\_codes**

| Column | Data Type | Description |
| :---- | :---- | :---- |
| **id** | CHAR(36) PK | Unique promo code UUID |
| **merchant\_id** | CHAR(36) FK | Reference to merchants table |
| **code** | VARCHAR(50) | Promo code (UNIQUE per merchant) |
| **discount\_type** | ENUM | Type: PERCENTAGE or FIXED\_AMOUNT |
| **discount\_value** | DECIMAL(10,2) | Discount value (percentage or fixed amount) |
| **max\_discount\_amount** | DECIMAL(10,2) NULL | Maximum discount cap (for percentage type) |
| **min\_transaction\_amount** | DECIMAL(10,2) NULL | Minimum transaction amount required |
| **valid\_from** | DATETIME | Validity start date |
| **valid\_until** | DATETIME | Validity end date |
| **max\_usage** | INT NULL | Total usage quota |
| **max\_usage\_per\_customer** | INT NULL | Per-customer usage limit |
| **is\_active** | BOOLEAN | Active status (default: TRUE) |

## **5.10 Optimization Indexes**

To maintain query performance at scale, the following indexes must be implemented:

* Compound Index on bookings: (asset\_unit\_id, status, start\_time, end\_time) for availability check queries.

* UNIQUE KEY on customers: (merchant\_id, email) to ensure customer uniqueness per merchant.

* UNIQUE KEY on promo\_codes: (merchant\_id, code) to prevent duplicate promo codes.

* Index on bookings: (merchant\_id, status) for order list filtering on the dashboard.

# **6\. User Flows**

## **6.1 Merchant Onboarding**

The onboarding flow is designed as a guided wizard, considering that the target users are likely SME owners (such as internet cafe or camera rental shop operators) who may be unfamiliar with technical terms like "API Key".

1. Registration Page: Merchant enters full name, email, and password. System sends a verification link to the email address.

2. Email Verification and First Login: Merchant clicks the verification link, then is directed to the login page.

3. Step 1 – Business Profile: Merchant enters business/store name, phone number (WhatsApp), and address. System creates records in the merchants and merchant\_users tables.

4. Step 2 – Payment Setup: A brief educational guide is displayed on how to obtain a Secret Key from Mayar.id. Merchant enters their Secret Key. System validates the key via the Mayar.id API. If invalid, an error message is shown. If valid, the system encrypts and stores the key.

5. Step 3 – First Catalog Setup: Merchant selects business type (Room or Physical Item), then enters initial inventory data. System saves data to the assets and asset\_units tables.

6. Completion: A success message is displayed along with the merchant’s public storefront URL.

**Note:** Provide a "Skip for Now" option on Steps 2 and 3 so merchants can explore the dashboard first. Mark the account as "Incomplete Setup" on the dashboard homepage.

## **6.2 Customer Booking (Storefront)**

Customers place bookings through the public storefront without needing to log in (guest checkout) to maximize conversion rates.

7. Storefront Page: Customer views the merchant’s public catalog listing available rooms/cameras with pricing.

8. Select Item and Time Range: Customer selects the desired item and specifies the start and end date/time.

9. Availability Check: System checks availability in real-time. If unavailable, a notification is displayed and the customer returns to the previous step.

10. Checkout Form: Customer fills in personal details (name, email, phone/WhatsApp). Customer may enter a promo code (optional). System calculates total price and upfront fee (deposit).

11. Confirmation and Payment: System creates a booking record with PENDING\_PAYMENT status. System calls the Mayar.id API using the merchant’s key to generate a payment link. Customer is redirected to the Mayar.id payment link to pay the upfront fee.

12. Backend Processing (Webhook): The webhook endpoint receives payment confirmation from Mayar.id. System checks if the customer’s email already exists in the customers table. If it exists, the booking is linked to the existing customer. If new, a new customer record is created. Booking status changes to CONFIRMED.

13. Notification: System sends an email/WhatsApp containing the booking receipt and Customer Portal access credentials (magic link).

14. Success Page: Displays a summary of the successfully placed order.

## **6.3 Customer Portal Access (Transaction History)**

Customers access their transaction history through the Customer Portal using magic link authentication (passwordless).

15. Portal Login Page: Customer enters their email address, then clicks the "Send Login Link" button.

16. Link Delivery: System generates a unique token in the magic\_links table and sends an email containing the login link. The UI transitions to an instruction screen: "Check your email inbox".

17. Authentication: Customer clicks the link in the email. System validates the token (not yet used and not expired). If valid, the system issues a JWT for the login session.

18. Customer Dashboard: Customer views a list of transaction history with status filters (All, Unpaid, Active, Completed, Cancelled) and a brief summary of each order.

19. Transaction Details: Customer can view full details of each order. If status is PENDING\_PAYMENT, a "Pay Now" button is displayed. If status is CONFIRMED/ACTIVE, the booking receipt is shown.

## **6.4 Catalog Management by Merchant**

20. Catalog Menu: Displays the list of inventory owned by the merchant.

21. Add/Edit Parent Entity (Assets): Merchant selects type (Room or Physical Item), enters name, base price, time unit, and specific attributes (PC specs, camera lens, etc.).

22. Manage Physical Units (Asset Units): Displays the list of units under a parent entity. Merchant adds units with an identifier (PC Number or Serial Number). Initial status: AVAILABLE.

23. Unit Status Update: Merchant can change a unit’s status to MAINTENANCE or BROKEN. The unit is automatically hidden from the public storefront.

**UX Note:** When a merchant changes a unit’s status to MAINTENANCE, the system should check whether there are any future bookings with CONFIRMED status on that unit. If so, display a warning.

## **6.5 Promo Code Management by Merchant**

24. Promo Menu: Displays the list of promo codes with their status (Active, Expired, Disabled) and usage metrics.

25. Create New Promo: Merchant enters a unique code, selects discount type (Percentage or Fixed Amount), and sets the discount value.

26. Advanced Settings (Optional): Maximum discount cap, minimum transaction amount, total quota, and per-customer limit. Hidden behind a "Show Advanced Settings" toggle to keep the main form simple.

27. Validity Period: Merchant sets the start and end date/time for the promo.

28. Validation and Save: System validates code name availability. If duplicate, a warning is displayed. If valid, the code is saved with is\_active \= TRUE.

## **6.6 Booking Management by Merchant**

29. Orders Menu: Displays the list of incoming orders with status filters (PENDING\_PAYMENT, CONFIRMED, ACTIVE, COMPLETED, CANCELLED).

30. Order Details: Customer information, rental details (item, time range), and cost summary (total, promo discount, upfront fee, remaining balance).

31. Operational Actions: Merchant starts rental (changes status to ACTIVE upon handing over equipment/granting access). Merchant completes rental (changes status to COMPLETED upon item return). Merchant cancels order (changes status to CANCELLED) if customer is a no-show.

32. Automatic Notifications: System sends email/WhatsApp notifications to the customer whenever an order status changes.

# **7\. Merchant Admin Panel Menu Structure**

Below is the merchant dashboard menu structure representing the system modules:

| Menu | Related Database Tables | Key Features |
| :---- | :---- | :---- |
| **Home (Dashboard)** | Aggregation of bookings, payments | Metrics: total active orders, today’s revenue, units currently rented |
| **Orders (Bookings)** | bookings, payments | Order list, manual rental/return confirmation, payment status monitoring |
| **Catalog & Inventory** | assets, asset\_units | Add/edit room/camera types, manage physical unit statuses |
| **Customers** | customers | Customer profiles, per-individual transaction history |
| **Promotions** | promo\_codes | Discount code creation, validity period and quota settings |
| **Settings** | merchants, merchant\_users | Business profile, Mayar.id API Key, staff and role management |

# **8\. Payment Gateway Integration (Mayar.id)**

## **8.1 BYOK (Bring Your Own Key) Mechanism**

Each merchant stores their own Mayar.id API Key on the platform. The platform acts as an intermediary that uses the key to perform payment operations on behalf of the merchant.

## **8.2 Payment Flow**

1. Merchant enters their Mayar.id API Key on the Settings page during onboarding or afterwards.

2. When a customer checks out, the backend calls the Mayar.id API using the relevant merchant’s key to create a payment link.

3. Customer is redirected to the Mayar.id payment link to pay the upfront fee (deposit).

4. After successful payment, Mayar.id sends a notification to the platform’s webhook endpoint.

5. Backend processes the webhook: updates payment status to PAID and booking status to CONFIRMED.

## **8.3 Webhook Listener**

The platform provides a dedicated endpoint to receive callbacks from Mayar.id. This endpoint must validate the authenticity of notifications (signature verification) before processing status changes. Every received notification must be recorded in the payments table for audit purposes.

# **9\. Security and Compliance**

## **9.1 Credential Encryption**

Merchant Mayar.id API Keys must be encrypted using the AES-256 standard before being stored in the mayar\_api\_key\_encrypted column. This prevents misuse in the event of a database breach.

## **9.2 Password Hashing**

All user passwords (merchant\_users) are stored as hashes using the bcrypt algorithm. Plaintext passwords are never stored in the database.

## **9.3 Data Isolation (Multi-tenancy)**

Every database query must include a merchant\_id filter to guarantee data isolation. Customers of merchant A cannot view the inventory or transaction data of merchant B.

## **9.4 Magic Link Authentication**

Magic link tokens are generated using cryptographically secure random functions, have a short validity period (15 minutes), and can only be used once. Upon successful validation, the system issues a JWT (JSON Web Token) for the customer’s login session.

## **9.5 Role-Based Access Control (RBAC)**

The merchant dashboard supports three role levels: OWNER (full access), ADMIN (operational management), and STAFF (restricted access). Every API endpoint must validate the user’s role before executing operations.

# **10\. Availability Check Logic**

The system determines unit (room/item) availability by finding units that have no active bookings within the requested time range. The core logic detects overlapping time between the customer’s requested time and existing bookings.

## **10.1 Time Overlap Rules**

An existing booking is considered to overlap with the requested time if the booking’s start\_time is less than the requested end time AND the booking’s end\_time is greater than the requested start time. Only bookings with PENDING\_PAYMENT, CONFIRMED, or ACTIVE statuses are included in the availability check.

## **10.2 Required Indexes**

A compound index on columns (asset\_unit\_id, status, start\_time, end\_time) in the bookings table must be created to maintain query performance as transaction volume grows.

# **11\. Promo Code Validation Logic**

When a customer enters a promo code on the checkout page, the backend must perform a series of validations before applying the discount:

6. Status Validation: Ensure is\_active is TRUE.

7. Validity Period Validation: Ensure the current time falls within the valid\_from to valid\_until range.

8. Total Quota Validation: Count the number of times the promo code has been used in the bookings table. Ensure it has not exceeded max\_usage.

9. Per-Customer Limit Validation: Count the number of times the promo code has been used by the specific customer. Ensure it has not exceeded max\_usage\_per\_customer.

10. Minimum Transaction Validation: Ensure the total booking price meets the min\_transaction\_amount.

11. Discount Calculation: Calculate the discount amount based on discount\_type and discount\_value. If percentage type, ensure the discount does not exceed max\_discount\_amount.

# **12\. Architecture Notes**

## **12.1 Planned Denormalization**

**JSON column on the assets table:** Under strict normalization (1NF), this column contains non-atomic values. However, this is a modern industry standard for handling dynamic attributes without needing to create dozens of additional tables or using the EAV (Entity-Attribute-Value) pattern.

**Price snapshot on the bookings table:** Storing total\_price, upfront\_fee, and discount\_amount in the transaction table is a requirement in financial systems. If a merchant changes rental prices in the future, historical transactions must not be affected.

## **12.2 Scalability**

* Using UUID (CHAR(36)) as Primary Keys facilitates database sharding in the future.

* Filtering by merchant\_id on every query guarantees data isolation in the multi-tenant architecture.

* MySQL’s native JSON data type (5.7.8+) supports efficient reading and searching of specific attributes.