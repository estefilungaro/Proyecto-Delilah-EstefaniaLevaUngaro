CREATE DATABASE delilahrestaurant2;
USE delilahrestaurant2;

CREATE TABLE users(
id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(255) NOT NULL,
fullname VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL,
telefono INT(50)NOT NULL,
direccion VARCHAR(255),
contrasenia VARCHAR(100)
);

CREATE TABLE productos(
id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
nombre VARCHAR(255),
precio INT NOT NULL
);

CREATE TABLE formas_de_pago(
id INT AUTO_INCREMENT PRIMARY KEY,
forma_pago VARCHAR(30)
);
CREATE TABLE estadosPosiblesPedido( 
id INT AUTO_INCREMENT PRIMARY KEY,
tipo_estado VARCHAR(30)
);
CREATE TABLE pedidos(
id INT PRIMARY KEY AUTO_INCREMENT,
id_usuario INT,
hora_pedido TIME,
id_estado INT,
id_forma_pago INT,
FOREIGN KEY (id_usuario) references users(id),
FOREIGN KEY (id_estado) references estadosPosiblesPedido(id),
FOREIGN KEY (id_forma_pago) references formas_de_pago(id)
);

CREATE TABLE items_pedido(
id INT PRIMARY KEY AUTO_INCREMENT,
id_prod INT,
cantidad_producto INT,
id_pedido INT,
FOREIGN KEY (id_prod) references productos(id),
FOREIGN KEY (id_pedido) references pedidos(id)
);

INSERT INTO estadosPosiblesPedido (tipo_estado) VALUES ("Nuevo"),("Confirmado"), ("Preparando"), ("Enviando"), ("Cancelado"), ("Entregado");
INSERT INTO formas_de_pago (forma_pago) VALUES ("Efectivo"), ("Débito"), ("Crédito");
INSERT INTO productos (nombre,precio) VALUES ("Pancho","120"),("Pizzanesa","600");
INSERT INTO productos (nombre,precio) VALUES ("Tallarines con salsa","220"),("Sorrentinos con salsa","250"),("Pizza de Rúcula","330");

SET GLOBAL log_bin_trust_function_creators = 1; 
-- ESTA PRIMER LINEA SOLO SE ESCRIBE UNA VEZ PARA HABILITAR LA CREACION DE FUNCIONES
DELIMITER $$
CREATE FUNCTION `pedido_total`(id_pedido INT) RETURNS int
BEGIN
	DECLARE total INT;
	set total = (SELECT sum(productos.precio * items_pedido.cantidad_producto)
				FROM items_pedido 
                INNER JOIN productos ON items_pedido.id_prod = productos.id 
				WHERE id_pedido = id_pedido);
	RETURN total;
END$$

