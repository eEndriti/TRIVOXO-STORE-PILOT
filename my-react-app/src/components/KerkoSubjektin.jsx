import React, { useState, useEffect, useContext } from "react";
import { Form, Button, InputGroup, ListGroup } from "react-bootstrap";
import { IoSearchSharp,IoAddSharp } from "react-icons/io5";
import ShtoNdryshoSubjektin from "./ShtoNdryshoSubjektin";
import AuthContext from "./AuthContext";
import AnimatedSpinner from "./AnimatedSpinner";

export default function SearchInput({ filter,value, onSelect,lloji }) {
  const [loading,setLoading] = useState(true)
  const [query, setQuery] = useState("");
  const [subjekti, setSubjekti] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal,setShowModal] = useState(false)
  const [data,setData] = useState({ndrysho:false,refresh:false,lloji:filter})
  const {authData} = useContext(AuthContext);
  
  useEffect(() => {

    const fetchData = async () => {
      setLoading(true);
        try{
          await window.api.fetchTableSubjekti(filter).then(receivedData => {
            let  filteredData = receivedData.filter(item => item.lloji == filter);
            if(authData.aKaUser != 'admin' && filter == 'furnitor'){
              console.log('data',data)
              filteredData = filteredData.filter(item => item.emertimi == 'posta')
            }

            setSubjekti(filteredData);
            setFilteredResults(filteredData);

            
          });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  
  }, [authData.aKaUser]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  console.log('filter;',filter)

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setQuery(searchTerm);

    const newFilteredResults = subjekti.filter((item) =>
      item.emertimi.toLowerCase().includes(searchTerm)
    );

    setFilteredResults(newFilteredResults);
    setShowDropdown(true);
  };

  const handleSelect = (result) => {
    onSelect(result); 
    setQuery(result.emertimi); 
    setShowDropdown(false); 
  };
  const handleAddSubject = () => setShowModal(true)
  const handleCloseModal = () => setShowModal(false)
  return (
    <>
    <div className="position-relative">
          <InputGroup className="">
            <Form.Control
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Subjekti..."
              autoFocus
              onFocus={() => setShowDropdown(true)}
            />
            <Button variant="outline-secondary border" disabled>
              <IoSearchSharp />
            </Button>
            <Button variant="success border" onClick={handleAddSubject}>
              <IoAddSharp />
            </Button>
          </InputGroup>

       
          {showDropdown && filteredResults.length > 0 && (
            <ListGroup className="position-absolute w-100 mt-2 overflow-auto bg-light"   style={{ maxHeight: '300px', minHeight: '100px', overflowY: 'auto', border: '1px solid #ccc' }}
    >
       {loading ? <AnimatedSpinner/>:
          <>
              {filteredResults.map((result) => (
                <ListGroup.Item
                  key={result.subjektiID}
                  action
                  onClick={() => handleSelect(result)}
                >
                  <div><strong>{result.emertimi}</strong></div>
                  <div>{result.kontakti}</div>
                </ListGroup.Item>
              ))}          
              </>}

            </ListGroup>
          )}
          <ShtoNdryshoSubjektin show={showModal} handleClose={handleCloseModal} data={data} />
        </div>
    </>
  );
}
