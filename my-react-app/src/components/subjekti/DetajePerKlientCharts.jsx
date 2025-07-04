import React, { useEffect, useState } from "react";
import { Line,LineChart, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "react-bootstrap";

const COLORS = ["#00C49F", "#0088FE", "#FFBB28", "#FF8042", "#D72638"];

const DetajePerKlientCharts = ({ totals = {},nrTransaksioneve,totalsFormatiMujore = {},lloji }) => {
  // Transformojmë të dhënat për Grafikun e Performancës
  //mduhet totals.totaliPageses edhe mduhet lengthi i combinedData per pieChart
  //mduhet totaliPagesaveFormatiMujor e njejta edhe per totalinBorgjeve


  const performanceData = totalsFormatiMujore.map((payment) => {
   
  
    const due = payment.totaliPagesave + payment.totaliBorgjit
    const totalPaid = payment.totaliPagesave
    const performance = due > 0 ? (totalPaid / due) * 100 : 100; // Avoid division by zero
    
    let color = "info"; // Default: Good (Green)
    if (performance < 50) color = "danger"; // Bad (Red)
    else if (performance < 80) color = "dark"; // Moderate (Yellow)
  
    return {
      month: payment.month,
      totalPaid,
      due,
      performance,
      color, 
    };
  });
  
  const tePaguara = Math.round(((totals.totalTotaliPageses / totals.totalTotaliPerPagese) * 100)*100)/100
  const tePaPaguara = (Math.round((100.00-tePaguara)*100)/100)
  return (
    <div className="d-flex flex-wrap justify-content-center gap-4 p-3">
      {/* Grafiku i Pagesave */}
      <Card className="p-3 shadow" style={{ width: "45%" }}>
        <h5 className="text-center">Kompletimi i Pagesave ne %</h5>
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
            <Pie
                data={[
                { name: "Te Paguara", value:tePaguara },
                { name: "Te Mbetura Per Pagese", value: tePaPaguara }
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ name, value }) => `${name}: ${value}%`} // Add percentage in the label
            >
                <Cell key="cell-0" fill="#28a745" /> {/* Green for Paid */}
                <Cell key="cell-1" fill="#dc3545" /> {/* Red for Unpaid */}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} /> {/* Show % in tooltip */}
            </PieChart>
        </ResponsiveContainer>
        </Card>


      {/* Grafiku i Borxhit Mujor */}
      {lloji == 'klient' && 
      <Card className="p-3 shadow"  style={{ width: "45%" }}>
        <h5 className="text-center">Trendi i Perfomances se Klientit</h5>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="totalPaid" stroke="#00C49F" name="Totali i Pageses" />
            <Line type="monotone" dataKey="due" stroke="#FF0000" name="Totali per Pagese" />
            </LineChart>
        </ResponsiveContainer>
        </Card>}
    </div>
  );
};

export default DetajePerKlientCharts;
