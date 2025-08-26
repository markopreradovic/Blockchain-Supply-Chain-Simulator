## 🌟 Features

- **Product Creation**: Create products with manufacturer information and type classification  
- **Supply Chain Tracking**: Track products through different stages (Manufacturer → Distributor → Retailer → Customer)  
- **Blockchain Validation**: Real-time blockchain integrity verification using SHA-256 hashing  
- **Product History**: Complete audit trail for each product's journey through the supply chain  
- **Visual Interface**: Modern dark-themed UI with responsive design  
- **Data Persistence**: In-memory storage with blockchain immutability  

---

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)  
- **Blockchain**: Custom implementation using Web Crypto API  
- **Hashing**: SHA-256 cryptographic hash function  
- **UI Framework**: Vanilla CSS with Grid and Flexbox layouts  
- **Data Storage**: In-memory JavaScript objects  

---

## 🏗️ Architecture

### Core Components
- **Block Class**: Represents individual blockchain blocks with timestamp, data, and hash calculations  
- **Blockchain Class**: Manages the chain of blocks with validation and integrity checks  
- **Product Management**: Handles product creation, processing, and state management  
- **Supply Chain Stages**: Four-stage pipeline (Manufacturer → Distributor → Retailer → Customer)  

### Key Features
- **Immutable Records**: All transactions are recorded in blocks and linked cryptographically  
- **Chain Validation**: Ensures data integrity through hash verification  
- **Product Lifecycle**: Complete tracking from creation to final customer delivery  
- **Visual Feedback**: Real-time status updates and stage visualization  
