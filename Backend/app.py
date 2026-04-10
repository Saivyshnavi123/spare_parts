import os
import psycopg2
import yaml
import uuid
import bcrypt
from flasgger import Swagger
from flask import Flask, request, jsonify
from flask_cors import CORS
from psycopg2.extras import RealDictCursor
from werkzeug.utils import secure_filename

app = Flask(__name__)

# --- CORS ---
CORS(app, support_credentials=True)

# --- Configuration ---
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SWAGGER'] = {'title': 'Auto Spare Parts API', 'uiversion': 3}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

with open("Backend/swagger.yaml") as f:
    template = yaml.safe_load(f)

swagger = Swagger(app, template=template)


# -----------------------------
# DB CONNECTION (FIXED)
# -----------------------------
def get_db_connection():
    return psycopg2.connect(
        dbname="spare_parts_vpja",
        user="spare_parts_vpja_user",
        password="PDbO9jg9BhA6wTJVguim0PwwSoHgl7C6",
        host="dpg-d77vcc7pm1nc73fk49ig-a.oregon-postgres.render.com",
        port="5432",
        sslmode='require'
    )


# -----------------------------
# INIT DB (RUN ONLY ONCE)
# -----------------------------
INITIALIZE_DB = False

if INITIALIZE_DB:
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        setup_queries = """
        DROP TABLE IF EXISTS order_items CASCADE;
        DROP TABLE IF EXISTS payments CASCADE;
        DROP TABLE IF EXISTS orders CASCADE;
        DROP TABLE IF EXISTS products CASCADE;
        DROP TABLE IF EXISTS customers CASCADE;

        CREATE TABLE IF NOT EXISTS customers (
            customer_id SERIAL PRIMARY KEY,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            address_line1 TEXT,
            address_line2 TEXT,
            city VARCHAR(100),
            state VARCHAR(100),
            zip_code VARCHAR(20),
            country VARCHAR(100),
            role VARCHAR(20) DEFAULT 'user'
        );

        CREATE TABLE IF NOT EXISTS products (
            product_id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            amount DECIMAL(10, 2) NOT NULL,
            stock_quantity INTEGER DEFAULT 0,
            image_url VARCHAR(255) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS orders (
            order_id SERIAL PRIMARY KEY,
            customer_id INTEGER REFERENCES customers(customer_id),
            total_amount DECIMAL(10, 2),
            status VARCHAR(50) DEFAULT 'Pending',
            payment_method VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
            item_id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(order_id),
            product_id INTEGER REFERENCES products(product_id),
            quantity INTEGER,
            price DECIMAL(10, 2),
            subtotal DECIMAL(10, 2)
        );

        CREATE TABLE IF NOT EXISTS payments (
            payment_id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(order_id),
            amount DECIMAL(10, 2),
            payment_method VARCHAR(50),
            payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO products (name, description, amount, stock_quantity, image_url)
        VALUES 
        ('Brake Pads', 'High-performance ceramic brake pads', 45.00, 100, '/static/uploads/default.jpg'),
        ('Oil Filter', 'Premium synthetic oil filter', 12.50, 250, '/static/uploads/default.jpg'),
        ('Spark Plug', 'Iridium spark plug', 8.00, 500, '/static/uploads/default.jpg')
        ON CONFLICT (name) DO NOTHING;

        INSERT INTO customers (first_name, last_name, email, password, role)
        VALUES ('Admin', 'User', 'admin@spare.com', %s, 'admin')
        ON CONFLICT (email) DO NOTHING;
        """

        hashed_admin_pw = bcrypt.hashpw("Admin@123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute(setup_queries, (hashed_admin_pw,))
        conn.commit()

        cursor.close()
        conn.close()

        print("Database initialized.")

    except Exception as e:
        print(f"DB init error: {e}")


# -----------------------------
# HELPERS
# -----------------------------
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# -----------------------------
# ROUTES
# -----------------------------

@app.route('/products', methods=['POST'])
def add_product():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        admin_id = request.form.get('admin_id')
        if not admin_id:
            return jsonify({"message": "Admin ID required"}), 400

        cursor.execute("SELECT role FROM customers WHERE customer_id = %s", (admin_id,))
        admin = cursor.fetchone()

        if not admin or admin['role'] != 'admin':
            return jsonify({"message": "Admin access required"}), 403

        image_path = "/static/uploads/default.png"

        if 'file' in request.files:
            file = request.files['file']
            if file and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{uuid.uuid4()}.{ext}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_path = f"/static/uploads/{filename}"

        cursor.execute("""
            INSERT INTO products (name, amount, description, stock_quantity, image_url)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING product_id
        """, (
            request.form.get('name'),
            float(request.form.get('amount', 0)),
            request.form.get('description'),
            int(request.form.get('stock_quantity', 0)),
            image_path
        ))

        conn.commit()

        return jsonify({'message': 'Product added successfully', 'image_url': image_path}), 201

    except Exception as error:
        conn.rollback()
        return jsonify({'message': str(error)}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("SELECT * FROM products")
        return jsonify({'results': cursor.fetchall()}), 200

    finally:
        cursor.close()
        conn.close()


@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("SELECT * FROM products WHERE product_id = %s", (product_id,))
        product = cursor.fetchone()

        if product:
            return jsonify(product), 200
        return jsonify({'message': 'Product not found'}), 404

    finally:
        cursor.close()
        conn.close()


@app.route('/login', methods=['POST'])
def login():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        data = request.json

        cursor.execute("SELECT * FROM customers WHERE email = %s", (data.get('email'),))
        user = cursor.fetchone()

        if user and bcrypt.checkpw(
            data.get('password').encode('utf-8'),
            user['password'].encode('utf-8')
        ):
            return jsonify({
                'message': 'Login successful',
                'isValid': True,
                'role': user['role'],
                'customer_id': user['customer_id']
            }), 200

        return jsonify({'message': 'Invalid Credentials'}), 401

    finally:
        cursor.close()
        conn.close()


@app.route('/register', methods=['POST'])
def register():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        data = request.json

        hashed_pw = bcrypt.hashpw(
            data.get('password').encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        cursor.execute("""
                       INSERT INTO customers (first_name, last_name, email, password, phone)
                       VALUES (%s, %s, %s, %s, %s)
        """, (
            data.get('first_name'),
            data.get('last_name'),
            data.get('email'),
            hashed_pw,
            data.get('phone')
        ))

        conn.commit()
        return jsonify({'message': 'Customer registered successfully'}), 201

    except psycopg2.IntegrityError:
        conn.rollback()
        return jsonify({'message': 'Email already exists'}), 400

    finally:
        cursor.close()
        conn.close()


@app.route('/customers/<int:customer_id>', methods=['POST'])
def update_customer(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        data = request.json

        cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (customer_id,))
        if not cursor.fetchone():
            return jsonify({'message': 'Customer not found'}), 404

        cursor.execute("""
            UPDATE customers
            SET first_name=%s, last_name=%s, email=%s, password=%s,
                phone=%s, address_line1=%s, address_line2=%s,
                city=%s, state=%s, zip_code=%s, country=%s
            WHERE customer_id=%s
        """, (
            data.get('first_name'),
            data.get('last_name'),
            data.get('email'),
            data.get('password'),
            data.get('phone'),
            data.get('address_line1'),
            data.get('address_line2'),
            data.get('city'),
            data.get('state'),
            data.get('zip_code'),
            data.get('country'),
            customer_id
        ))

        conn.commit()
        return jsonify({'message': 'Customer updated successfully'}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/orders', methods=['POST'])
def create_order():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        data = request.json

        total_amount = 0
        order_items_list = []

        for item in data['items']:
            cursor.execute("SELECT amount FROM products WHERE product_id = %s", (item['product_id'],))
            prod = cursor.fetchone()

            if prod:
                subtotal = prod['amount'] * item['quantity']
                total_amount += subtotal
                order_items_list.append((item['product_id'], item['quantity'], prod['amount'], subtotal))

        cursor.execute("""
            INSERT INTO orders (customer_id, total_amount, payment_method)
            VALUES (%s, %s, %s)
            RETURNING order_id
        """, (data['customer_id'], total_amount, data['payment_method']))

        order_id = cursor.fetchone()['order_id']

        for entry in order_items_list:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
                VALUES (%s, %s, %s, %s, %s)
            """, (order_id, *entry))

        conn.commit()

        return jsonify({'message': 'Order created', 'order_id': order_id}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/orders/<int:order_id>', methods=['PUT'])
def update_order_status(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        data = request.json
        cursor.execute("UPDATE orders SET status = %s WHERE order_id = %s",
                       (data['status'], order_id))
        conn.commit()
        return jsonify({'message': 'Status updated'}), 200

    finally:
        cursor.close()
        conn.close()


@app.route('/orders/<int:order_id>/payment', methods=['POST'])
def process_payment(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        data = request.json

        cursor.execute("""
            INSERT INTO payments (order_id, amount, payment_method)
            VALUES (%s, %s, %s)
        """, (order_id, data['amount'], data['payment_method']))

        cursor.execute("UPDATE orders SET status = 'Completed' WHERE order_id = %s", (order_id,))
        conn.commit()

        return jsonify({'message': 'Payment processed'}), 200

    finally:
        cursor.close()
        conn.close()


@app.route('/customers/<int:customer_id>/orders', methods=['GET'])
def get_customer_orders(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("SELECT * FROM orders WHERE customer_id = %s", (customer_id,))
        orders = cursor.fetchall()

        for order in orders:
            cursor.execute("SELECT * FROM order_items WHERE order_id = %s", (order['order_id'],))
            order['items'] = cursor.fetchall()

        return jsonify({'results': orders})

    finally:
        cursor.close()
        conn.close()


@app.route('/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (customer_id,))
        customer = cursor.fetchone()

        return jsonify(customer) if customer else (jsonify({'message': 'Not found'}), 404)

    finally:
        cursor.close()
        conn.close()


@app.route('/customers', methods=['GET'])
def get_customers():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("SELECT * FROM customers")
        return jsonify({'results': cursor.fetchall()})

    finally:
        cursor.close()
        conn.close()


# -----------------------------
# RUN APP
# -----------------------------
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port, debug=True)