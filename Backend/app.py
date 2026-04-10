import os
import psycopg2
import yaml
from flasgger import Swagger
from flask import Flask, request, jsonify
from flask_cors import CORS
from psycopg2.extras import RealDictCursor
from werkzeug.utils import secure_filename

app = Flask(__name__)
# CORS styling as per reference
CORS(app, support_credentials=True)

# Initialize Swagger
swagger = Swagger(app)

UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SWAGGER'] = {'title': 'Auto Spare Parts API', 'uiversion': 3}
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
INITIALIZE_DB = True

# Load Swagger
try:
    with open("swagger.yaml", "r") as f:
        swagger_template = yaml.safe_load(f)
    swagger = Swagger(app, template=swagger_template)
except FileNotFoundError:
    swagger = Swagger(app)


# Connect to your PostgreSQL database
try:
    conn = psycopg2.connect(
        dbname="spare_parts_vpja",
        user="spare_parts_vpja_user",
        password="PDbO9jg9BhA6wTJVguim0PwwSoHgl7C6",
        host="dpg-d77vcc7pm1nc73fk49ig-a.oregon-postgres.render.com",
        port="5432",
        sslmode='require'
    )
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    print("Database connection established.")

    # --- INITIALIZATION SCRIPT ---
    if INITIALIZE_DB:
        setup_queries = """
    -- CASCADE is essential to remove tables with Foreign Key dependencies
    DROP TABLE IF EXISTS order_items CASCADE;
    DROP TABLE IF EXISTS payments CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS customers CASCADE;
        -- 1. Customers Table
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

        -- 2. Products Table
        CREATE TABLE IF NOT EXISTS products (
            product_id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            amount DECIMAL(10, 2) NOT NULL,
            stock_quantity INTEGER DEFAULT 0
            image_url VARCHAR(255) NOT NULL,
        );

        -- 3. Orders Table
        CREATE TABLE IF NOT EXISTS orders (
            order_id SERIAL PRIMARY KEY,
            customer_id INTEGER REFERENCES customers(customer_id),
            total_amount DECIMAL(10, 2),
            status VARCHAR(50) DEFAULT 'Pending',
            payment_method VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 4. Order Items Table
        CREATE TABLE IF NOT EXISTS order_items (
            item_id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(order_id),
            product_id INTEGER REFERENCES products(product_id),
            quantity INTEGER,
            price DECIMAL(10, 2),
            subtotal DECIMAL(10, 2)
        );

        -- 5. Payments Table (Required for /payment route)
        CREATE TABLE IF NOT EXISTS payments (
            payment_id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(order_id),
            amount DECIMAL(10, 2),
            payment_method VARCHAR(50),
            payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Seed Initial Data
        INSERT INTO products (name, description, amount, stock_quantity)
        VALUES 
        ('Brake Pads', 'High-performance ceramic brake pads', 45.00, 100),
        ('Oil Filter', 'Premium synthetic oil filter', 12.50, 250),
        ('Spark Plug', 'Iridium spark plug', 8.00, 500)
        ON CONFLICT DO NOTHING;

        INSERT INTO customers (first_name, last_name, email, password, role)
        VALUES ('Admin', 'User', 'admin@spare.com', 'Admin@123', 'admin')
        ON CONFLICT (email) DO NOTHING;
        """
        cursor.execute(setup_queries)
        conn.commit()
        print("Database initialized: Tables verified/created and sample data seeded.")

except Exception as e:
    print(f"Error connecting to or initializing database: {e}")


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/products', methods=['POST'])
def add_product():
    # 1. Admin Validation
    admin_id = request.form.get('admin_id')
    cursor.execute("SELECT role FROM customers WHERE customer_id = %s", (admin_id,))
    admin = cursor.fetchone()

    if not admin or admin['role'] != 'admin':
        return jsonify({"message": "Admin access required"}), 403

    # 2. Handle File Upload
    image_path = None
    if 'file' in request.files:
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            image_path = f"/static/uploads/{filename}"

    # 3. Insert into Database
    try:
        insert_query = """
                       INSERT INTO products (name, amount, description, stock_quantity, image_url)
                       VALUES (%s, %s, %s, %s, %s) RETURNING product_id \
                       """
        cursor.execute(insert_query, (
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


# API to get a list of all Products
@app.route('/products', methods=['GET'])
def get_products():
    try:
        # Fetch all columns including the newly added image_url
        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()

        # Return as JSON
        return jsonify({'results': products}), 200
    except Exception as error:
        print(f"Error fetching products: {error}")
        return jsonify({'message': 'Internal Server Error'}), 500

# API to authenticate user
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    cursor.execute("SELECT * FROM customers WHERE email = %s", (email,))
    user = cursor.fetchone()
    if user:
        if user['password'] == password:
            return jsonify({
                'message': 'Login successful',
                'isValid': True,
                'role': user['role'],
                'customer_id': user['customer_id']
            }), 200
        else:
            return jsonify({'message': 'Invalid Credentials'}), 401
    else:
        return jsonify({'message': 'User not found'}), 404


# API to Register user
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    insert_query = """
           INSERT INTO Customers (first_name, last_name, email, password, phone)
           VALUES (%s, %s, %s, %s, %s)
       """
    try:
        cursor.execute(insert_query, (
            data.get('first_name'),
            data.get('last_name'),
            data.get('email'),
            data.get('password'),
            data.get('phone')
        ))
        conn.commit()
        return jsonify({'message': 'Customer added successfully'}), 201
    except psycopg2.IntegrityError:
        conn.rollback()
        return jsonify({'message': 'Error: Could not add Customer. Email already exists'}), 400


# API to get a list of Products
@app.route('/products', methods=['GET'])
def get_products():
    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()
    return jsonify({'results': products})


# API to get Product Details by ID
@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        cursor.execute("SELECT * FROM products WHERE product_id = %s", (product_id,))
        product = cursor.fetchone()
        if product:
            return jsonify(product), 200
        else:
            return jsonify({'message': 'Product not found'}), 404
    except psycopg2.Error as e:
        print("Error fetching data from database:", e)
        return jsonify({'message': 'Internal Server Error'}), 500


# API to Update Customer Details
@app.route('/customers/<int:customer_id>', methods=['POST'])
def update_customer(customer_id):
    data = request.json
    cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (customer_id,))
    customer = cursor.fetchone()

    if not customer:
        return jsonify({'message': 'Customer not found'}), 404

    customer_dict = dict(customer)

    update_query = """
        UPDATE customers
        SET first_name = %s, last_name = %s, email = %s, password = %s, phone = %s,
        address_line1 = %s, address_line2 = %s, city = %s, state = %s, zip_code = %s,
        country = %s, role = %s
        WHERE customer_id = %s
    """

    try:
        cursor.execute(update_query, (
            data.get('first_name'), data.get('last_name'), data.get('email'),
            data.get('password'), data.get('phone'), data.get('address_line1'),
            data.get('address_line2'), data.get('city'), data.get('state'),
            data.get('zip_code'), data.get('country'), customer_dict.get('role'), customer_id
        ))
        conn.commit()
        return jsonify({'message': 'Customer updated successfully'}), 200
    except psycopg2.Error as e:
        conn.rollback()
        print("Error updating data in database:", e)
        return jsonify({'message': 'Internal Server Error'}), 500


# API to create an order
@app.route('/orders', methods=['POST'])
def create_order():
    data = request.json
    customer_id = data['customer_id']
    payment_method = data['payment_method']
    items = data['items']

    total_amount = 0
    order_items = []

    for item in items:
        cursor.execute("SELECT amount FROM products WHERE product_id = %s", (item['product_id'],))
        product = cursor.fetchone()
        if product:
            subtotal = product['amount'] * item['quantity']
            total_amount += subtotal
            order_items.append((item['product_id'], item['quantity'], product['amount'], subtotal))

    cursor.execute(
        "INSERT INTO orders (customer_id, total_amount, payment_method) VALUES (%s, %s, %s) RETURNING order_id",
        (customer_id, total_amount, payment_method))
    order_id = cursor.fetchone()['order_id']

    for item in order_items:
        cursor.execute(
            "INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES (%s, %s, %s, %s, %s)",
            (order_id, item[0], item[1], item[2], item[3]))

    conn.commit()
    return jsonify({'message': 'Order created successfully', 'order_id': order_id}), 201


# API to update order status
@app.route('/orders/<int:order_id>', methods=['PUT'])
def update_order_status(order_id):
    data = request.json
    status = data['status']
    cursor.execute("UPDATE orders SET status = %s WHERE order_id = %s", (status, order_id))
    conn.commit()
    return jsonify({'message': 'Order status updated successfully'}), 200


# API to process payment
@app.route('/orders/<int:order_id>/payment', methods=['POST'])
def process_payment(order_id):
    data = request.json
    amount = data['amount']
    payment_method = data['payment_method']
    cursor.execute("INSERT INTO payments (order_id, amount, payment_method) VALUES (%s, %s, %s)",
                   (order_id, amount, payment_method))

    cursor.execute("UPDATE orders SET status = 'Completed' WHERE order_id = %s", (order_id,))
    conn.commit()
    return jsonify({'message': 'Payment processed successfully'}), 200


# API to get customer orders
@app.route('/customers/<int:customer_id>/orders', methods=['GET'])
def get_customer_orders(customer_id):
    cursor.execute("SELECT * FROM orders WHERE customer_id = %s", (customer_id,))
    orders = cursor.fetchall()
    for order in orders:
        cursor.execute("SELECT * FROM order_items WHERE order_id = %s", (order['order_id'],))
        order['items'] = cursor.fetchall()
    return jsonify({'results': orders})


# Get Customer by ID
@app.route('/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (customer_id,))
    customer = cursor.fetchone()
    if customer:
        return jsonify(customer)
    else:
        return jsonify({'message': 'Customer not found'}), 404


# Get List of customers
@app.route('/customers', methods=['GET'])
def get_customers():
    cursor.execute("SELECT * FROM customers")
    customers = cursor.fetchall()
    return jsonify({'results': customers})


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port, debug=True)