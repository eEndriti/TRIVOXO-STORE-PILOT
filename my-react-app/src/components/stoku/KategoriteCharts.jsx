import {useState,useEffect, useContext} from "react";
import {BarChart,Bar,PieChart,Pie,LineChart,Line,CartesianGrid,XAxis,YAxis,Tooltip,Legend,Cell} from "recharts";
import { Card, CardBody ,Row} from "react-bootstrap";
import { useTranslation } from "react-i18next";
const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

const KategoriteCharts = ({chartData = {}}) => {
  console.log(chartData)
  const {t} = useTranslation('stoku')
    const [selectedCategory, setSelectedCategory] = useState('');
    const [filteredData, setFilteredData] = useState(chartData);
    const [trendiKategoriseData, setTrendiKategoriseData] = useState([]);
    useEffect(() => {
        if(selectedCategory){
            fetchData()
        }
    }, [selectedCategory]);

    const fetchData = async () => {
        try {
            const data1 = await window.api.fetchTableQuery(`SELECT 
                MuajiViti,
                COUNT(produktiID) AS NrProdukteve
            FROM (
                SELECT 
                    FORMAT(s.dataShitjes, 'MM-yyyy') AS MuajiViti,
                    sp.produktiID,
                    YEAR(s.dataShitjes) AS Year,
                    MONTH(s.dataShitjes) AS Month
                FROM 
                    shitje s
                JOIN 
                    shitjeProdukti sp ON s.shitjeID = sp.shitjeID
                JOIN 
                    produkti p ON sp.produktiID = p.produktiID
                WHERE 
                    p.kategoriaID = ${selectedCategory}
                    
            ) AS SubQuery
            GROUP BY 
                MuajiViti
            ORDER BY 
                MIN(Year), MIN(Month);`)

            const data2 = await window.api.fetchTableQuery(`
                    SELECT 
                    MuajiViti,
                    COUNT(produktiID) AS NrProdukteve
                FROM (
                    SELECT 
                        FORMAT(s.dataPerfundimit, 'MM-yyyy') AS MuajiViti,
                        sp.produktiID,
                        YEAR(s.dataPerfundimit) AS Year,
                        MONTH(s.dataPerfundimit) AS Month
                    FROM 
                        servisimi s
                    JOIN 
                        servisProdukti sp ON s.servisimiID = sp.servisimiID
                    JOIN 
                        produkti p ON sp.produktiID = p.produktiID
                    WHERE 
                        p.kategoriaID =  ${selectedCategory}
                        
                ) AS SubQuery
                GROUP BY 
                    MuajiViti
                ORDER BY 
                    MIN(Year), MIN(Month);`)

            const mergedData = mergeAndSum(data1, data2);
            setTrendiKategoriseData(mergedData)
            console.log('mergedData',mergedData)
        } catch (error) {
            console.log(error)
        }
    }

const mergeAndSum = (arr1, arr2) => {
    const resultMap = new Map();
  
    const addToMap = (arr) => {
      arr.forEach(item => {
        if (resultMap.has(item.MuajiViti)) {
          resultMap.set(item.MuajiViti, resultMap.get(item.MuajiViti) + item.NrProdukteve);
        } else {
          resultMap.set(item.MuajiViti, item.NrProdukteve);
        }
      });
    };
  
    addToMap(arr1);
    addToMap(arr2);
  
    const mergedArray = Array.from(resultMap, ([MuajiViti, NrProdukteve]) => ({ MuajiViti, NrProdukteve }));
  
    return mergedArray;
  };
  
  
const handleCategoryChange = (e) => {
    const categoryID = e.target.value;
    setSelectedCategory(categoryID);

    const filtered = chartData.filter(item => item.kategoriaID === parseInt(categoryID));
    setFilteredData(filtered);
  };

    return (
        <div className="d-flex flex-column gap-4 p-4">
          <Row className="d-flex flex-row gap-4">
            <Card  style={{width: '45%'}}>
              <CardBody>
                <h2 className="text-xl font-semibold">{t('Shitjet per Kategori')}</h2>
                <PieChart width={300} height={300}>
                  <Pie
                    data={chartData}
                    dataKey="TotaliShitur"
                    nameKey="emertimi"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </CardBody>
            </Card>
      
            <Card  style={{width: '45%'}}>
              <CardBody>
                <h2 className="text-xl font-semibold">{t('Stoku per Kategori')}</h2>
                <BarChart width={400} height={300} data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="emertimi" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_sasia" fill="#24AD5D" name={t('Sasia Totale')}/>
                </BarChart>
              </CardBody>
            </Card>
          </Row>
      
          <Row className="d-flex flex-row gap-4">
          <Card  style={{width: '45%'}}>
            <CardBody>
                <h2 className="text-xl font-semibold">{t('Profiti per Kategori')}</h2>
                <BarChart width={400} height={300} data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="emertimi" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="TotaliFitimit" fill="#2A3D4E" name = {t('Totali i Profitit')} />
                </BarChart>
              </CardBody>
            </Card>
      
            
            <Card style={{ width: '45%' }}>
                <CardBody>
                    <h2 className="text-xl font-semibold">{t('Trendi i Shitjeve')}</h2>

                    {/* Category Dropdown */}
                    <div className="mb-4">
                    <label htmlFor="categorySelect" className="mr-2">{t('Zgjidh Kategorinë')}</label>
                    <select
                        id="categorySelect"
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className="form-select"
                    >
                        <option value="">{t('Përzgjedh Kategorinë')}</option>
                        {chartData.map((category) => (
                        <option key={category.kategoriaID} value={category.kategoriaID}>
                            {category.emertimi}
                        </option>
                        ))}
                    </select>
                    </div>

                    {/* LineChart */}
                    {trendiKategoriseData.length > 0 ?<LineChart width={400} height={300} data={trendiKategoriseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="MuajiViti" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="NrProdukteve" stroke="#ff7300" name={t('Nr i Produkteve')}/>
                    </LineChart>:<p>{t('Nuk ka të dhëna për këtë kategori')}</p>}
                </CardBody>
            </Card>
          </Row>
        </div>
      );
      
};

export default KategoriteCharts;
