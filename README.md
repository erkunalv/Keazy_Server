# Project Keazy

This repository serves as the initial Keazy project server that holds for both:
  1. Data server as well as
  2. ML Model

To make it work out:
1. Open CMD admin
~~~bash
net start MongoDB
~~~

2. Open CMD in "Keazy-backend" folder
~~~bash
npm run seed
npm run dev
~~~

3. Open CMD in "ml-service" folder
~~~bash
python app.py
~~~