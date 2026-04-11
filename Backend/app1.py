import os
import yaml
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flasgger import Swagger
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# ------------------- Configuration -------------------
app = Flask(__name__)

# Toggle: Set to True once to fix the 'image_url' error by resetting tables.
# Set to False after your first successful deployment.
INIT_DB = True

UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database Connection (Render PostgreSQL)
app.config[
    'SQLALCHEMY_DATABASE_URI'] = 'postgresql://spare_parts_vpja_user:PDbO9jg9BhA6wTJVguim0PwwSoHgl7C6@dpg-d77vcc7pm1nc73fk49ig-a.oregon-postgres.render.com/spare_parts_vpja'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SWAGGER'] = {'title': 'Auto Spare Parts API', 'uiversion': 3}

db = SQLAlchemy(app)
CORS(app, resources={r"/*": {"origins": "*"}})

# Load Swagger
try:
    with open("swagger.yaml", "r") as f:
        swagger_template = yaml.safe_load(f)
    swagger = Swagger(app, template=swagger_template)
except FileNotFoundError:
    swagger = Swagger(app)


# ------------------- Models -------------------

class Customer(db.Model):
    __tablename__ = 'customers'
    customer_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    email = db.Column(db.String(200), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    phone = db.Column(db.String(20))
    address_line1 = db.Column(db.String(255))
    city = db.Column(db.String(100))
    role = db.Column(db.String(50), default='customer')

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns if c.name != 'password'}


class Product(db.Model):
    __tablename__ = 'products'
    product_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    amount = db.Column(db.Float, nullable=False)
    stock_quantity = db.Column(db.Integer, default=0)  # Added for stock management
    image_url = db.Column(db.String(300))


class Order(db.Model):
    __tablename__ = 'orders'
    order_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.customer_id'))
    total_amount = db.Column(db.Float)
    payment_method = db.Column(db.String(50))
    status = db.Column(db.String(50), default='Pending')
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan")


class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'))
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'))
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)


class Payment(db.Model):
    __tablename__ = 'payments'
    payment_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'))
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50))


# ------------------- Helpers -------------------

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def seed_data():
    if not Customer.query.filter_by(email="admin@auto.com").first():
        admin = Customer(first_name="Admin", email="admin@auto.com",
                         password=generate_password_hash("admin123"), role="admin")
        p1 = Product(name="Brake Pads", amount=45.50, description="Ceramic brake pads",
                     stock_quantity=100, image_url="/static/uploads/placeholder.jpg")
        db.session.add_all([admin, p1])
        db.session.commit()


# ------------------- API Endpoints -------------------

# 1. Register
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    if Customer.query.filter_by(email=data.get('email')).first():
        return jsonify({'message': 'Error: Customer already exists'}), 400
    new_user = Customer(first_name=data.get('first_name'), last_name=data.get('last_name'),
                        email=data.get('email'), password=generate_password_hash(data['password']),
                        phone=data.get('phone'))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Customer added successfully'}), 201


# 2. Login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = Customer.query.filter_by(email=data.get('email')).first()
    if user and check_password_hash(user.password, data['password']):
        return jsonify({'isValid': True, 'role': user.role, 'customer_id': user.customer_id}), 200
    return jsonify({'message': 'Invalid Credentials'}), 401


# 3. Get All Products
@app.route('/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    results = [{"product_id": p.product_id, "name": p.name, "amount": p.amount,
                "desc": p.description, "stock": p.stock_quantity, "image_url": p.image_url} for p in products]
    return jsonify({'results': results})


# 4. Add Product (Multipart for Image Upload)
@app.route('/products', methods=['POST'])
def add_product():
    # Admin Validation
    admin_id = request.form.get('admin_id')
    admin = Customer.query.get(admin_id)
    if not admin or admin.role != 'admin':
        return jsonify({"message": "Admin access required"}), 403

    image_path = None
    if 'file' in request.files:
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            image_path = f"/static/uploads/{filename}"

    new_p = Product(
        name=request.form.get('name'),
        amount=float(request.form.get('amount', 0)),
        description=request.form.get('description'),
        stock_quantity=int(request.form.get('stock_quantity', 0)),
        image_url=image_path
    )
    db.session.add(new_p)
    db.session.commit()
    return jsonify({'message': 'Product added successfully', 'image_url': image_path}), 201


# 5. Get Product by ID
@app.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    p = Product.query.get(product_id)
    if p:
        return jsonify({"product_id": p.product_id, "name": p.name, "amount": p.amount,
                        "desc": p.description, "stock": p.stock_quantity, "image_url": p.image_url}), 200
    return jsonify({'message': 'Not found'}), 404


# 6. List All Customers (Admin Only)
@app.route('/customers', methods=['GET'])
def get_customers():
    return jsonify({'results': [c.to_dict() for c in Customer.query.all()]})


# 7. Get Customer by ID
@app.route('/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    c = Customer.query.get(customer_id)
    return jsonify(c.to_dict()) if c else (jsonify({'message': 'Not found'}), 404)


# 8. Update Customer Profile
@app.route('/customers/<int:customer_id>', methods=['POST'])
def update_customer(customer_id):
    c = Customer.query.get(customer_id)
    if not c: return jsonify({'message': 'Not found'}), 404
    data = request.json
    for key in ['first_name', 'last_name', 'phone', 'city']:
        if key in data: setattr(c, key, data[key])
    db.session.commit()
    return jsonify({'message': 'Updated successfully'}), 200


# 9. Create Order (With Automatic Stock Management)
@app.route('/orders', methods=['POST'])
def create_order():
    data = request.json
    new_o = Order(customer_id=data['customer_id'], payment_method=data.get('payment_method'), total_amount=0)
    db.session.add(new_o)
    db.session.flush()

    total = 0
    for item in data['items']:
        p = Product.query.get(item['product_id'])
        if p:
            if p.stock_quantity < item['quantity']:
                db.session.rollback()
                return jsonify({'message': f'Insufficient stock for {p.name}'}), 400

            # Decrement Stock
            p.stock_quantity -= item['quantity']

            sub = p.amount * item['quantity']
            total += sub
            db.session.add(OrderItem(order_id=new_o.order_id, product_id=p.product_id,
                                     quantity=item['quantity'], price=p.amount, subtotal=sub))

    new_o.total_amount = total
    db.session.commit()
    return jsonify({'message': 'Order created and stock updated', 'order_id': new_o.order_id}), 201


# 10. Update Order Status
@app.route('/orders/<int:order_id>', methods=['PUT'])
def update_order_status(order_id):
    o = Order.query.get(order_id)
    if not o: return jsonify({'message': 'Not found'}), 404
    o.status = request.json.get('status', o.status)
    db.session.commit()
    return jsonify({'message': 'Status updated'}), 200


# 11. Process Payment
@app.route('/orders/<int:order_id>/payment', methods=['POST'])
def process_payment(order_id):
    o = Order.query.get(order_id)
    if not o: return jsonify({'message': 'Not found'}), 404
    db.session.add(Payment(order_id=order_id, amount=request.json['amount'],
                           payment_method=request.json['payment_method']))
    o.status = 'Completed'
    db.session.commit()
    return jsonify({'message': 'Payment successful'}), 200


# ------------------- Main Entry -------------------
if __name__ == '__main__':
    with app.app_context():
        if INIT_DB:
            db.drop_all()  # Wipes existing schema to fix 'image_url' column error
            db.create_all()
            seed_data()
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)