from flask import Flask, render_template, request, redirect, url_for
import sqlite3
from datetime import datetime

app = Flask(__name__)
DB = 'money.db'

# Initialize database tables
def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS income (id INTEGER PRIMARY KEY, description TEXT, amount REAL, date TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY, description TEXT, amount REAL, date TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS loans (id INTEGER PRIMARY KEY, lender TEXT, balance REAL, due_date TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS investments (id INTEGER PRIMARY KEY, description TEXT, amount REAL, date TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS goals (id INTEGER PRIMARY KEY, name TEXT, current REAL, target REAL)''')
    conn.commit()
    conn.close()

init_db()

# Helper to fetch totals
def get_totals():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT SUM(amount) FROM income")
    total_income = c.fetchone()[0] or 0
    c.execute("SELECT SUM(amount) FROM expenses")
    total_expense = c.fetchone()[0] or 0
    c.execute("SELECT SUM(balance) FROM loans")
    total_loans = c.fetchone()[0] or 0
    c.execute("SELECT SUM(amount) FROM investments")
    total_investments = c.fetchone()[0] or 0
    net_worth = total_income - total_expense + total_investments - total_loans
    conn.close()
    return total_income, total_expense, total_loans, total_investments, net_worth

# Dashboard
@app.route('/')
def dashboard():
    total_income, total_expense, total_loans, total_investments, net_worth = get_totals()
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT * FROM goals")
    goals = c.fetchall()
    conn.close()
    return render_template('dashboard.html', total_income=total_income, total_expense=total_expense,
                           total_loans=total_loans, total_investments=total_investments,
                           net_worth=net_worth, goals=goals)

# Income page
@app.route('/income', methods=['GET', 'POST'])
def income():
    if request.method == 'POST':
        desc = request.form['description']
        amt = float(request.form['amount'])
        date = datetime.now().strftime("%Y-%m-%d")
        conn = sqlite3.connect(DB)
        c = conn.cursor()
        c.execute("INSERT INTO income (description, amount, date) VALUES (?, ?, ?)", (desc, amt, date))
        conn.commit()
        conn.close()
        return redirect(url_for('income'))
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT * FROM income")
    incomes = c.fetchall()
    conn.close()
    return render_template('income.html', incomes=incomes)

# Expenses page
@app.route('/expenses', methods=['GET', 'POST'])
def expenses():
    if request.method == 'POST':
        desc = request.form['description']
        amt = float(request.form['amount'])
        date = datetime.now().strftime("%Y-%m-%d")
        conn = sqlite3.connect(DB)
        c = conn.cursor()
        c.execute("INSERT INTO expenses (description, amount, date) VALUES (?, ?, ?)", (desc, amt, date))
        conn.commit()
        conn.close()
        return redirect(url_for('expenses'))
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT * FROM expenses")
    expenses = c.fetchall()
    conn.close()
    return render_template('expenses.html', expenses=expenses)

# Loans page
@app.route('/loans', methods=['GET', 'POST'])
def loans():
    if request.method == 'POST':
        lender = request.form['lender']
        balance = float(request.form['balance'])
        due_date = request.form['due_date']
        conn = sqlite3.connect(DB)
        c = conn.cursor()
        c.execute("INSERT INTO loans (lender, balance, due_date) VALUES (?, ?, ?)", (lender, balance, due_date))
        conn.commit()
        conn.close()
        return redirect(url_for('loans'))
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT * FROM loans")
    loans = c.fetchall()
    conn.close()
    return render_template('loans.html', loans=loans)

# Investments page
@app.route('/investments', methods=['GET', 'POST'])
def investments():
    if request.method == 'POST':
        desc = request.form['description']
        amt = float(request.form['amount'])
        date = datetime.now().strftime("%Y-%m-%d")
        conn = sqlite3.connect(DB)
        c = conn.cursor()
        c.execute("INSERT INTO investments (description, amount, date) VALUES (?, ?, ?)", (desc, amt, date))
        conn.commit()
        conn.close()
        return redirect(url_for('investments'))
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT * FROM investments")
    investments = c.fetchall()
    conn.close()
    return render_template('investments.html', investments=investments)

# Goals page
@app.route('/goals', methods=['GET', 'POST'])
def goals():
    if request.method == 'POST':
        name = request.form['name']
        target = float(request.form['target_amount'])
        conn = sqlite3.connect(DB)
        c = conn.cursor()
        c.execute("INSERT INTO goals (name, current, target) VALUES (?, ?, ?)", (name, 0, target))
        conn.commit()
        conn.close()
        return redirect(url_for('goals'))
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT * FROM goals")
    goals = c.fetchall()
    conn.close()
    return render_template('goals.html', goals=goals)

if __name__ == '__main__':
    app.run(debug=True)
