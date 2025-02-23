const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();

const VTEX_API_URL =
  "https://{sualoja}.vtexcommercestable.com.br/api/oms/pvt/orders";

const db = new sqlite3.Database("./orders.db", (err) => {
  if (err) console.error("Erro ao conectar ao SQLite:", err);
  else console.log("Conectado ao SQLite");
});

db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    orderId TEXT PRIMARY KEY,
    totalItems INTEGER,
    items TEXT,
    timestamp TEXT
  )
`);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOrdersFromVTEX(pageNumber = 1) {
  try {
    console.log(`Buscando página ${pageNumber}...`);
    const response = await axios.get(`${VTEX_API_URL}`, {
      headers: {
        VtexIdclientAutCookie: "",
        Accept: "application/json",
      },
      params: {
        page: pageNumber,
        per_page: 100,
        f_status: "invoiced",
      },
    });
    return response.data.list;
  } catch (error) {
    console.error("Erro ao buscar pedidos da VTEX:", error);
    return [];
  }
}

async function fetchOrderDetails(orderId) {
  try {
    const response = await axios.get(`${VTEX_API_URL}/${orderId}`, {
      headers: {
        VtexIdclientAutCookie: "",
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do pedido ${orderId}:`, error);
    return null;
  }
}

async function populateOrderIds() {
  let currentPage = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const orderList = await fetchOrdersFromVTEX(currentPage);
    if (currentPage === 50) {
      hasMorePages = false;
      break;
    }

    for (const currentOrder of orderList) {
      const itemCount = currentOrder.totalItems;
      if (itemCount > 1) {
        db.run(
          "INSERT OR IGNORE INTO orders (orderId, totalItems) VALUES (?, ?)",
          [currentOrder.orderId, itemCount],
          (err) => {
            if (err) console.error("Erro ao inserir orderId:", err);
          }
        );
      }
    }

    currentPage++;
    if (hasMorePages) {
      console.log("Aguardando 500ms antes da próxima requisição...");
      await delay(500);
    }
  }
  console.log("Banco populado com orderIds de pedidos com mais de um item.");
}

async function populateOrderDetails() {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT orderId FROM orders WHERE items IS NULL",
      async (err, rows) => {
        if (err) return reject(err);

        for (const row of rows) {
          const orderDetails = await fetchOrderDetails(row.orderId);
          if (orderDetails) {
            db.run(
              "UPDATE orders SET items = ?, timestamp = ? WHERE orderId = ?",
              [
                JSON.stringify(orderDetails.items),
                orderDetails.creationDate,
                row.orderId,
              ],
              (err) => {
                if (err)
                  console.error(
                    `Erro ao atualizar pedido ${row.orderId}:`,
                    err
                  );
              }
            );
            console.log(`Detalhes do pedido ${row.orderId} atualizados.`);
            await delay(1000);
          }
        }
        resolve();
      }
    );
  });
}

async function initialize() {
  await populateOrderIds();
  await populateOrderDetails();
  console.log("Processo de inicialização concluído.");
}

initialize();
