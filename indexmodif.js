const Sequelize = require('sequelize');
const sequelize = new Sequelize('mysql://root:root@localhost:9001/delilahrestaurant2');
const express = require("express");
const app = express();
const bodyParse = require("body-parser");
const jwt = require('jsonwebtoken');
const firmaSeguraJWT = "my_secret_password";

app.use(bodyParse.json());

// RUTAS
app.get('/productos', (req, res) => { 
    sequelize.query('SELECT * FROM productos', { type: sequelize.QueryTypes.SELECT }
    ).then((productos) => {
        res.json(productos);
        console.log(productos);
    });
})

app.get('/productos/:productoId', (req, res) => {
    const productoId = req.params.productoId;
    console.log(productoId);
    sequelize.query('SELECT * FROM productos WHERE id = ?', { replacements: [productoId], type: sequelize.QueryTypes.SELECT })
        .then((rtas) => {
            console.log(rtas);
            res.status(200).send(rtas);
        })
})

app.get('/users',verificarToken, (req, res) => {

    sequelize.query('SELECT * FROM users', { type: sequelize.QueryTypes.SELECT }
    ).then((users) => {
        res.json(users);
        console.log(users);
    });
})



app.get('/admin-detalle/:pedidoId',verificarToken,async (req,res) => {
        const pedidoId = req.params.pedidoId;
        let pedido = await sequelize.query('SELECT estadosPosiblesPedido.tipo_estado,sum(items_pedido.cantidad_producto * productos.precio) AS Total,formas_de_pago.forma_pago,users.direccion,users.fullname,users.username,users.email,users.telefono FROM items_pedido INNER JOIN pedidos ON id_pedido = pedidos.id  INNER JOIN productos ON id_prod = productos.id INNER JOIN formas_de_pago ON id_forma_pago = formas_de_pago.id INNER JOIN estadosPosiblesPedido ON id_estado = estadosPosiblesPedido.id INNER JOIN users ON pedidos.id_usuario = users.id where id_pedido = ?',{ replacements: [pedidoId] , type: sequelize.QueryTypes.SELECT })
        pedido[0].items = await sequelize.query('SELECT productos.nombre,productos.precio,items_pedido.cantidad_producto FROM items_pedido INNER JOIN pedidos ON id_pedido = pedidos.id INNER JOIN productos ON productos.id = id_prod WHERE id_pedido = ?',{replacements: [pedidoId], type: sequelize.QueryTypes.SELECT })
        res.json(pedido);    
})

app.get('/admin-vista-pedidos',verificarToken, async (req, res) => {
   
            pedidos = await sequelize.query('SELECT estadosPosiblesPedido.tipo_estado,pedidos.hora_pedido,pedidos.id,formas_de_pago.forma_pago, pedido_total(pedidos.id) AS "Total",users.fullname,users.direccion FROM pedidos JOIN estadosPosiblesPedido ON pedidos.id_estado = estadosPosiblesPedido.id JOIN formas_de_pago ON pedidos.id_forma_pago = formas_de_pago.id JOIN users ON users.id = pedidos.id_usuario',{type: sequelize.QueryTypes.SELECT });
            for (let i = 0; i < pedidos.length; i++) {
            pedidos[i].detalles = await sequelize.query('SELECT productos.nombre,productos.precio,items_pedido.cantidad_producto FROM items_pedido JOIN productos ON items_pedido.id_prod = productos.id WHERE items_pedido.id_pedido = ?', { replacements: [pedidos[i].id],type: sequelize.QueryTypes.SELECT})
            console.log(pedidos[i]) 
            console.log("pedidos[i].id",pedidos[i].id)
        } 
           
            res.json(pedidos);
        });


    

app.get('/carrito-cliente/:pedidoId', async (req,res) => {
        const pedidoId = req.params.pedidoId;
        let pedido = await sequelize.query('SELECT sum(items_pedido.cantidad_producto * productos.precio) AS Total,formas_de_pago.forma_pago,users.direccion FROM items_pedido INNER JOIN pedidos ON id_pedido = pedidos.id  INNER JOIN productos ON id_prod = productos.id INNER JOIN formas_de_pago ON id_forma_pago = formas_de_pago.id INNER JOIN users ON pedidos.id_usuario = users.id where id_pedido = ?',{ replacements: [pedidoId] , type: sequelize.QueryTypes.SELECT })
        pedido[0].items = await sequelize.query('SELECT productos.nombre,productos.precio,items_pedido.cantidad_producto FROM items_pedido INNER JOIN pedidos ON id_pedido = pedidos.id INNER JOIN productos ON productos.id = id_prod WHERE id_pedido = ?',{replacements: [pedidoId], type: sequelize.QueryTypes.SELECT })
        res.json(pedido);    
    })


app.get('/historial/:pedidoId',async (req,res)=>{
    const pedidoId = req.params.pedidoId;
        let pedido = await sequelize.query('SELECT estadosPosiblesPedido.tipo_estado,sum(items_pedido.cantidad_producto * productos.precio) AS Total,formas_de_pago.forma_pago,users.direccion FROM items_pedido  INNER JOIN pedidos ON id_pedido = pedidos.id INNER JOIN estadosPosiblesPedido ON id_estado = estadosPosiblesPedido.id INNER JOIN productos ON id_prod = productos.id INNER JOIN formas_de_pago ON id_forma_pago = formas_de_pago.id INNER JOIN users ON pedidos.id_usuario = users.id where id_pedido = ?',{ replacements: [pedidoId] , type: sequelize.QueryTypes.SELECT })
        pedido[0].items = await sequelize.query('SELECT productos.nombre,productos.precio,items_pedido.cantidad_producto FROM items_pedido INNER JOIN pedidos ON id_pedido = pedidos.id INNER JOIN productos ON productos.id = id_prod WHERE id_pedido = ?',{replacements: [pedidoId], type: sequelize.QueryTypes.SELECT })
        res.json(pedido);    
})

/////////////////////////////////////////////////////////////////
app.post('/login', async (req, res) => {
    const { usuario, contrasenia } = req.body;
    var validado = await validarUsuarioContrasenia2(usuario, contrasenia);

    const token = await jwt.sign({ usuario, contrasenia }, firmaSeguraJWT);
    res.json({ token });    
});

///MIDDLEWARES
function validarUsuarioContrasenia2(usuario, contrasenia) {
    if (usuario === "admin" && contrasenia === "contraAdmin") {
        console.log("login admin correcto,sera direccionado");
        return true;
    } else {
        sequelize.query(`SELECT users.username,users.contrasenia FROM users WHERE  users.username = ?`, { replacements: [usuario], type: sequelize.QueryTypes.SELECT })

            .then((resultado) => {
                if (usuario === resultado[0].username && contrasenia === resultado[0].contrasenia) {
                    console.log("login correcto,sera direccionado");
                    return true;
                    } else {
                    console.log("usuario incorrecto");
                }

            });
    }
}
     

function verificarToken(req, res, next) {
    const autHeader = req.headers.authorization;
    if (autHeader) {
        const token = autHeader.split(' ')[1]; 
        jwt.verify(token, firmaSeguraJWT, (err, data) => {
              if (data.usuario === "admin" && data.contrasenia === "contraAdmin") {
                req.user = data; 
                next();
            } else {
                res.status(403).json({ error: "Usted no tiene permiso para ingresar" });
                    }
        });
    } else {
        res.status(401).json({ error: "No se recibio un token" });
    }
}

function esUsuario(req, res, next) {
    const autHeader = req.headers.authorization;
    if (autHeader) {
    
             next();
                } else {
                res.status(403).json({ error: "No se recibio un token" });
                    }}

///////////////////////////////////////REGISTRO///////////////////////////////////////////////////////////////////
app.post('/registro',async (req, res) => { //crear nuevo usuario
    var usuario = req.body;
    var { username, contrasenia } = usuario;
    
    await sequelize.query('INSERT INTO users (username,fullname,email,telefono,direccion,contrasenia) VALUES (:username,:fullname,:email,:telefono,:direccion,:contrasenia)'
        , { replacements: usuario })
        .then(async (resultados) => {
            const token = await jwt.sign({ username, contrasenia }, firmaSeguraJWT);
            res.json({ usuario, token });
            console.log({ usuario, token });
        });

})
///////////////////////////////////////
app.post('/pedidos',esUsuario ,(req, res) => {
    var pedido = req.body;
    sequelize.query('INSERT INTO pedidos (id_usuario,hora_pedido,id_estado,id_forma_pago) VALUES (:id_usuario,:hora_pedido,:id_estado,:id_forma_pago)'
        , { replacements: pedido })
        .then((resultados) => {
            res.send("Pedido agregado con éxito").json({resultados});
            
        });
})
app.post('/items',esUsuario, async(req, res) => {
    var pedido2 = req.body;
    console.log(pedido2);
    pedido2.forEach(element => {
      sequelize.query('INSERT INTO items_pedido (id_prod,cantidad_producto,id_pedido) VALUES (:id_prod,:cantidad_producto,:id_pedido) ', 
      { replacements: element})
             .then((resultados2) => {
                    console.log(resultados2);
               });
      });
       res.send("Pedido2 agregado con éxito");
})

app.post('/productos',verificarToken, (req, res) => {
    var producto = req.body;
    sequelize.query('INSERT INTO productos (nombre,precio) VALUES (:nombre, :precio)'
        , { replacements: producto })
        .then((resultados) => {
            res.send("Producto agregado con éxito");
            console.log(resultados);
        });

})

///////////////////////////////////////////////////////////////////////////////////////
app.put('/productos/:productoId',verificarToken, (req, res) => {
    const productoId = req.params.productoId;
    const { nombre, precio } = req.body;

    sequelize.query('UPDATE productos SET nombre = ?,precio = ?  WHERE id = ?', { replacements: [nombre, precio, productoId] })
        .then((productoModif) => {
            console.log(productoModif);
            res.status(200).send("El producto se modifico con éxito");
        })
})

app.put('/actualizar_pedidos/:pedidoId',verificarToken, (req, res) => {
    const pedidoId = req.params.pedidoId;
    const { id_estado } = req.body;

    sequelize.query('UPDATE pedidos SET id_estado = ?  WHERE id = ?', { replacements: [id_estado, pedidoId] })
        .then((pedidoModif) => {
            console.log(pedidoModif);
            res.status(200).send("El producto se modifico con éxito");
        })
})

////////////////////////////////////////////////////////////////////////////////////////////

app.delete('/productos/:productoId',verificarToken,async (req, res) => {
    const productoId = req.params.productoId;
    let borradoPedido = await sequelize.query('DELETE FROM items_pedido  WHERE id_prod = ? ', { replacements: [productoId] })
    let borradoProducto = await sequelize.query('DELETE FROM productos  WHERE id = ? ', { replacements: [productoId] })
    res.send("Producto borrado con éxito");
    })
//////////////////////////////////////////////////////////
app.delete('/pedidos/:pedidosId',verificarToken,async (req, res) => {
    const pedidosId = req.params.pedidosId;
    let borradoItemsPedido = await sequelize.query('DELETE FROM items_pedido  WHERE id_pedido = ? ', { replacements: [pedidosId] })
    let borradoPedido = await sequelize.query('DELETE FROM pedidos  WHERE id = ? ', { replacements: [pedidosId] })
res.send("El pedido se borró con éxito");
})

app.listen(3000);






