# Project Documentation
### BURHANI Hardware and Machinery

## 1. Introduction
**BURHANI Hardware and Machinery** is a web-based E-commerce platform developed using the Django framework. The application is designed to manage the sales of hardware products, machinery, power tools, and spare parts. It provides a seamless shopping experience for users, allowing them to browse categories, manage a virtual cart, and securely place orders using online payment or cash on delivery.

## 2. Project Status
The project is currently **LIVE** and accessible at:
[https://burhani-hardware-machinery.onrender.com](https://burhani-hardware-machinery.onrender.com)

## 3. Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Python 3.x, Django 5.x
- **Database**: SQLite3 (Development) / PostgreSQL (Production)
- **Payment Gateway**: Razorpay Integration
- **Media Management**: Cloudinary Integration
- **Hosting**: Render Platform

## 4. Key Features
- **User Authentication**: Secure Registration, Login, and Logout functionality.
- **Product Management**: Categorized products (Machinery, Power Tools, Spare Parts).
- **Search & Filter**: Real-time product search and category-based filtering.
- **Shopping Cart**: Dynamic cart management (Add, Remove, Update quantity).
- **Secure Checkout**:
    - **Online Payment**: Integrated with Razorpay for secure transactions.
    - **Cash on Delivery (COD)**: Traditional payment option.
- **Order Tracking**: Users can view their order history and status.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## 5. Database Design (ER Diagram)
The following diagram shows the relationships between Users, Products, Carts, and Orders.

```mermaid
erDiagram
    USER ||--o{ CART : "has"
    USER ||--o{ ORDER : "places"
    CATEGORY ||--o{ PRODUCT : "contains"
    PRODUCT ||--o{ CART : "is added to"
    ORDER ||--o{ ORDER_ITEM : "contains"
    PRODUCT ||--o{ ORDER_ITEM : "is ordered in"
    
    USER {
        int id
        string username
        string password
    }
    CATEGORY {
        int id
        string name
        image image
    }
    PRODUCT {
        int id
        int category_id
        string name
        string description
        int price
        bool is_spare_part
        bool is_machinery
        bool is_power_tools
    }
    CART {
        int id
        int user_id
        int product_id
        int product_quantity
        int product_total
    }
    ORDER {
        int id
        int user_id
        text address
        int bill
        string payment_status
        string razorpay_order_id
        string razorpay_payment_id
        string razorpay_signature
        datetime created_at
    }
    ORDER_ITEM {
        int id
        int order_id
        int product_id
        int product_quantity
        int product_total
    }
```

## 6. Workflow Diagram
This flowchart illustrates the complete user journey from browsing to successful order placement.

```mermaid
graph TD
    Start((Start)) --> Home[Home Page / Product Listing]
    Home --> Search[Search Products]
    Home --> Filter[Filter by Category]
    Home --> ProdDetail[Product Detail]
    ProdDetail --> Cart[Add to Cart]
    Cart --> Checkout{Checkout}
    Checkout --> Online[Razorpay Online Payment]
    Checkout --> COD[Cash on Delivery]
    Online --> PaymentSuccess{Payment Success?}
    PaymentSuccess -- Yes --> PlaceOrder[Create Order & Clear Cart]
    PaymentSuccess -- No --> Cart
    COD --> PlaceOrder
    PlaceOrder --> YourOrders[Your Orders Page]
    YourOrders --> End((End))

    subgraph Authentication
        Login[Login]
        Register[Register]
    end

    Start -.-> Authentication
    Authentication -.-> Home
```

## 7. Conclusion
The BURHANI Hardware and Machinery project successfully demonstrates the implementation of a full-stack e-commerce solution. It covers essential aspects of software development, including database management, backend logic, frontend integration, and third-party API usage (Razorpay). The project is deployed and fully functional in a production environment.
