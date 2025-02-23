const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
app.use(express.json());

const db = new sqlite3.Database("./orders.db");

const itemAssociations = new Map();
const productCache = new Map();

function preprocessData() {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT items FROM orders WHERE items IS NOT NULL",
      (err, orderRows) => {
        if (err) return reject(err);

        const tempPairFrequencies = new Map();

        for (const row of orderRows) {
          const itemsInOrder = JSON.parse(row.items);

          for (const item of itemsInOrder) {
            productCache.set(item.id, item);
          }

          const itemIds = itemsInOrder.map((item) => item.id);
          for (let i = 0; i < itemIds.length; i++) {
            const currentItem = itemIds[i];
            if (!itemAssociations.has(currentItem)) {
              itemAssociations.set(currentItem, new Map());
            }
            const currentMap = itemAssociations.get(currentItem);

            for (let j = i + 1; j < itemIds.length; j++) {
              const pairedItem = itemIds[j];
              const pairKey = [currentItem, pairedItem].sort().join("-");
              tempPairFrequencies.set(
                pairKey,
                (tempPairFrequencies.get(pairKey) || 0) + 1
              );

              currentMap.set(pairedItem, (currentMap.get(pairedItem) || 0) + 1);
              if (!itemAssociations.has(pairedItem)) {
                itemAssociations.set(pairedItem, new Map());
              }
              itemAssociations
                .get(pairedItem)
                .set(currentItem, currentMap.get(pairedItem) || 0);
            }
          }
        }

        resolve();
      }
    );
  });
}

function getRecommendations(cartItems) {
  return new Promise((resolve) => {
    const recommendedItems = [];

    for (const cartItem of cartItems) {
      if (itemAssociations.has(cartItem)) {
        const associations = itemAssociations.get(cartItem);
        for (const [pairedItem, frequency] of associations) {
          if (!cartItems.includes(pairedItem)) {
            recommendedItems.push({ item: pairedItem, frequency });
          }
        }
      }
    }

    const topRecommendations = recommendedItems
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)
      .map((rec) => rec.item);

    resolve(topRecommendations);
  });
}

function getProductById(skuId) {
  return new Promise((resolve) => {
    const product = productCache.get(skuId) || null;
    resolve(product);
  });
}

app.post("/recommend", async (req, res) => {
  const cartItems = req.body.items;
  if (!cartItems || !Array.isArray(cartItems)) {
    return res.status(400).json({ error: "Carrinho inválido" });
  }

  try {
    const recommendations = await getRecommendations(cartItems);
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: "Erro ao gerar recomendações" });
  }
});

app.get("/product/:id", async (req, res) => {
  const skuId = req.params.id;

  try {
    const product = await getProductById(skuId);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: "Produto não encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

preprocessData()
  .then(() => {
    app.listen(3000, () => {
      console.log("Servidor rodando na porta 3000");
    });
  })
  .catch((err) => {
    console.error("Erro ao pré-processar dados:", err);
  });
