class Block {
    constructor(data, previousHash) {
        this.timestamp = new Date().toISOString();
        this.data = data;
        this.previousHash = previousHash;
        this.hash = null;
    }

    async calculateHash() {
        const data = this.timestamp + JSON.stringify(this.data) + this.previousHash;
        const msgBuffer = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async initHash() {
        this.hash = await this.calculateHash();
        return this;
    }
}

class Blockchain {
    constructor() {
        this.chain = [];
        this.init();
    }

    async init() {
        const genesisBlock = await this.createGenesisBlock();
        this.chain = [genesisBlock];
    }

    async createGenesisBlock() {
        const block = new Block({
            type: 'genesis',
            message: 'Genesis blok - početak lanca snabdijevanja'
        }, '0');
        await block.initHash();
        return block;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    async addBlock(data) {
        const previousBlock = this.getLatestBlock();
        const newBlock = new Block(data, previousBlock.hash);
        await newBlock.initHash();
        this.chain.push(newBlock);
        return newBlock;
    }

    async isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            const recalculatedHash = await currentBlock.calculateHash();
            if (currentBlock.hash !== recalculatedHash) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }
}

const blockchain = new Blockchain();
const products = {};
let productCounter = 1;

const supplyChainStages = ['manufacturer', 'distributor', 'retailer', 'customer'];
const stageNames = {
    'manufacturer': 'Proizvođač',
    'distributor': 'Distributer',
    'retailer': 'Maloprodaja',
    'customer': 'Kupac'
};

async function createProduct() {
    const productName = document.getElementById('productName').value.trim();
    const manufacturer = document.getElementById('manufacturer').value.trim();
    const productType = document.getElementById('productType').value;

    if (!productName || !manufacturer) {
        alert('Unesi sve potrebne podatke!');
        return;
    }

    const productId = productCounter;
    productCounter++;

    const productData = {
        id: productId,
        name: productName,
        type: productType,
        currentStage: 'manufacturer',
        history: [{
            stage: 'manufacturer',
            entity: manufacturer,
            timestamp: new Date().toISOString(),
            successful: true
        }]
    };

    products[productId] = productData;

    await blockchain.addBlock({
        type: 'product_created',
        productId: productId,
        productName: productName,
        manufacturer: manufacturer,
        productType: productType
    });

    updateProductSelect();
    displayProducts();
    updateBlockchainInfo();

    document.getElementById('productName').value = '';
    document.getElementById('manufacturer').value = '';
    
    alert(`Proizvod ${productName} (${productId}) uspješno kreiran!`);
}

async function processProduct() {
    const productId = document.getElementById('selectProduct').value;
    const newStage = document.getElementById('currentStage').value;
    const entityName = document.getElementById('entityName').value.trim();
    const isSuccessful = document.getElementById('isSuccessful').value === 'true';

    if (!productId || !entityName) {
        alert('Izaberi proizvod i unesi naziv entiteta!');
        return;
    }

    const product = products[productId];
    const currentStageIndex = supplyChainStages.indexOf(product.currentStage);
    const newStageIndex = supplyChainStages.indexOf(newStage);

    if (newStageIndex <= currentStageIndex) {
        alert('Proizvod ne može ići unazad u lancu snabdijevanja!');
        return;
    }

    if (newStageIndex !== currentStageIndex + 1) {
        alert('Proizvod može napredovati samo za jedan korak u lancu!');
        return;
    }

    product.currentStage = newStage;
    product.history.push({
        stage: newStage,
        entity: entityName,
        timestamp: new Date().toISOString(),
        successful: isSuccessful
    });

    await blockchain.addBlock({
        type: 'product_processed',
        productId: productId,
        stage: newStage,
        entity: entityName,
        successful: isSuccessful
    });

    displayProducts();
    updateBlockchainInfo();

    document.getElementById('entityName').value = '';
    
    const statusText = isSuccessful ? 'uspješno' : 'neuspješno';
    alert(`Proizvod ${productId} je ${statusText} obrađen u fazi ${stageNames[newStage]}!`);
}

function updateProductSelect() {
    const select = document.getElementById('selectProduct');
    select.innerHTML = '<option value="">-- Izaberite proizvod --</option>';
    
    Object.values(products).forEach(product => {
        if (product.currentStage !== 'customer') {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.id} - ${product.name}`;
            select.appendChild(option);
        }
    });
}

function displayProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    if (Object.keys(products).length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #718096; grid-column: 1/-1;">Nema proizvoda u sistemu.</p>';
        return;
    }

    Object.values(products).forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-header">
                <div class="product-id">${product.id}</div>
                <div class="status ${product.currentStage}">${stageNames[product.currentStage]}</div>
            </div>
            <h3>${product.name}</h3>
            <p><strong>Tip:</strong> ${product.type}</p>
            <div class="supply-chain">
                ${generateSupplyChainVisualization(product)}
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <button class="btn" onclick="showProductHistory('${product.id}')">Istorija</button>
            </div>
        `;
        grid.appendChild(productCard);
    });
}

function generateSupplyChainVisualization(product) {
    const currentStageIndex = supplyChainStages.indexOf(product.currentStage);
    let html = '';

    supplyChainStages.forEach((stage, index) => {
        if (index > 0) {
            html += '<div class="chain-arrow">→</div>';
        }
        
        let className = 'chain-step';
        if (index < currentStageIndex) {
            className += ' completed';
        } else if (index === currentStageIndex) {
            className += ' current';
        } else {
            className += ' pending';
        }

        html += `<div class="${className}">${stageNames[stage]}</div>`;
    });

    return html;
}

function showProductHistory(productId) {
    const product = products[productId];
    const historyDiv = document.getElementById('productHistory');
    
    let historyHtml = `<h3>${product.name} (${productId})</h3>`;
    
    product.history.forEach(entry => {
        const date = new Date(entry.timestamp).toLocaleString('sr-RS');
        const statusClass = entry.successful ? 'success' : 'error';
        const statusText = entry.successful ? 'Uspješno' : 'Neuspješno';
        
        historyHtml += `
            <div class="history-item">
                <div class="history-timestamp">${date}</div>
                <div><strong>Faza:</strong> ${stageNames[entry.stage]}</div>
                <div><strong>Entitet:</strong> ${entry.entity}</div>
                <div><strong>Status:</strong> <span style="color: ${entry.successful ? '#48bb78' : '#f56565'}">${statusText}</span></div>
            </div>
        `;
    });
    
    historyDiv.innerHTML = historyHtml;
    document.getElementById('historyModal').style.display = 'block';
}

async function verifyBlockchain() {
    const isValid = await blockchain.isChainValid();
    const statusElement = document.getElementById('integrityStatus');
    
    if (isValid) {
        statusElement.textContent = 'Validan';
        statusElement.className = 'integrity-status integrity-valid';
    } else {
        statusElement.textContent = 'Nevalidan';
        statusElement.className = 'integrity-status integrity-invalid';
    }
}

async function updateBlockchainInfo() {
    document.getElementById('blockCount').textContent = blockchain.chain.length;
    
    if (blockchain.chain.length > 0) {
        const lastBlock = blockchain.getLatestBlock();
        const date = new Date(lastBlock.timestamp).toLocaleString('sr-RS');
        document.getElementById('lastBlockTime').textContent = date;
    }
    
    await verifyBlockchain();
}

function showBlockchainDetails() {
    const detailsDiv = document.getElementById('blockchainDetails');
    let detailsHtml = '';
    
    blockchain.chain.forEach((block, index) => {
        const date = new Date(block.timestamp).toLocaleString('sr-RS');
        detailsHtml += `
            <div class="block">
                <div class="block-header">
                    <h4>Blok #${index}</h4>
                    <small>${date}</small>
                </div>
                <div><strong>Hash:</strong> <span class="block-hash">${block.hash}</span></div>
                <div><strong>Prethodni Hash:</strong> <span class="block-hash">${block.previousHash}</span></div>
                <div><strong>Podaci:</strong></div>
                <pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 5px; font-size: 0.9em; overflow-x: auto;">${JSON.stringify(block.data, null, 2)}</pre>
            </div>
        `;
    });
    
    detailsDiv.innerHTML = detailsHtml;
    document.getElementById('blockchainModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('blockchainModal').style.display = 'none';
}

function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

window.onclick = function(event) {
    const blockchainModal = document.getElementById('blockchainModal');
    const historyModal = document.getElementById('historyModal');
    
    if (event.target === blockchainModal) {
        blockchainModal.style.display = 'none';
    }
    if (event.target === historyModal) {
        historyModal.style.display = 'none';
    }
}

//blockchain.chain[1].hash = "12345";

document.addEventListener('DOMContentLoaded', async function() {
    await blockchain.init();
    
    updateBlockchainInfo();
    displayProducts();
    
    setTimeout(async () => {
        // Test Proizvod 1
        document.getElementById('productName').value = 'Apple Watch';
        document.getElementById('manufacturer').value = 'Apple Inc.';
        document.getElementById('productType').value = 'elektronika';
        await createProduct();
        
        // Test Proizvod 1
        document.getElementById('productName').value = 'Crni Hljeb';
        document.getElementById('manufacturer').value = 'Pekara Banja Luka';
        document.getElementById('productType').value = 'hrana';
        await createProduct();

        // Test Proizvod 1
        document.getElementById('productName').value = 'Patike';
        document.getElementById('manufacturer').value = 'Buzz';
        document.getElementById('productType').value = 'obua';
        await createProduct();

    }, 1000);
});