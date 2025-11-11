//creahash
const bcryptjs= require("bcryptjs");

const password = "Alexia_3030";

bcryptjs.hash(password, 10).then(hashedPassword => {
  console.log("Hash generado:", hashedPassword);
}).catch(err => {
  console.error("Error generando el hash:", err);
});
