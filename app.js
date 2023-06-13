const express = require("express");
const csv = require("csv-parser");
const fs = require("fs");

const app = express();
const PORT = 3000;

const dataset = [];

// Load the dataset from the CSV file
fs.createReadStream("data.csv")
  .pipe(csv())
  .on("data", (data) => {
    dataset.push(data);
  })
  .on("end", () => {
    console.log("Dataset loaded successfully");
  });

// API 1: Total items sold in Marketing for the last quarter of the year
app.get("/api/total_items", (req, res) => {
  const { start_date, end_date, department } = req.query;

  const filteredData = dataset.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      itemDate >= new Date(start_date) &&
      itemDate <= new Date(end_date) &&
      item.department.toLowerCase() === department.toLowerCase()
    );
  });

  const totalItems = filteredData.reduce(
    (sum, item) => sum + parseInt(item.quantity),
    0
  );

  res.json({ total_items: totalItems });
});

// API 2: Nth most sold item in terms of quantity sold in Q4 or in terms of total price in Q2
app.get("/api/nth_most_total_item", (req, res) => {
  const { item_by, start_date, end_date, n } = req.query;

  const filteredData = dataset.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      itemDate >= new Date(start_date) &&
      itemDate <= new Date(end_date) &&
      (itemDate.getMonth() + 1 === 4 || itemDate.getMonth() + 1 === 2)
    );
  });

  let sortedItems;
  if (item_by === "quantity") {
    sortedItems = filteredData.sort(
      (a, b) => parseInt(b.quantity) - parseInt(a.quantity)
    );
  } else if (item_by === "price") {
    sortedItems = filteredData.sort(
      (a, b) => parseFloat(b.price) - parseFloat(a.price)
    );
  }

  const nthItem = sortedItems[n - 1].item_name;

  res.json({ item_name: nthItem });
});

// API 3: Percentage of sold items (seats) department-wise
app.get("/api/percentage_of_department_wise_sold_items", (req, res) => {
  const { start_date, end_date } = req.query;

  const filteredData = dataset.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= new Date(start_date) && itemDate <= new Date(end_date);
  });

  const departmentCounts = {};
  const totalItems = filteredData.length;

  filteredData.forEach((item) => {
    if (departmentCounts[item.department]) {
      departmentCounts[item.department]++;
    } else {
      departmentCounts[item.department] = 1;
    }
  });

  const percentageByDepartment = {};
  for (const department in departmentCounts) {
    const percentage = (departmentCounts[department] / totalItems) * 100;
    percentageByDepartment[department] = `${percentage.toFixed(2)}%`;
  }

  res.json(percentageByDepartment);
});

// API 4: Monthly sales for any product
app.get("/api/monthly_sales", (req, res) => {
  const { product, year } = req.query;

  const filteredData = dataset.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      item.product.toLowerCase() === product.toLowerCase() &&
      itemDate.getFullYear() === parseInt(year)
    );
  });

  const monthlySales = Array(12).fill(0);

  filteredData.forEach((item) => {
    const month = new Date(item.date).getMonth();
    monthlySales[month] += parseFloat(item.price);
  });

  res.json(monthlySales);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
