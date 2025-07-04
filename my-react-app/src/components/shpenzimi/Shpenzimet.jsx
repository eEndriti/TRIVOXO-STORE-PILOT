import React, { useContext,useState,useEffect } from 'react'
import { Container,Row,Col,Table,Form,FormGroup,Button } from 'react-bootstrap'
import AuthProvider,{normalizoDaten,localTodayDate, formatLongDateToAlbanian} from '../AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan,faEdit,faChevronDown, faChevronRight,faExchangeAlt } from '@fortawesome/free-solid-svg-icons'; 
import AnimatedSpinner from '../AnimatedSpinner';
import ModalPerPyetje from '../ModalPerPyetje'
import NdryshoShpenzimin from './NdryshoShpenzimin';
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';

export default function Shpenzimet() {
    const [loading,setLoading] = useState(true)
    const [buttonLoading,setButtonLoading] = useState(false)
    const {authData} = useContext(AuthProvider)
    const [shpenzimet,setShpenzimet] = useState({})
    const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
    const [shifraSearch,setShifraSearch] = useState()
    const [emertimiSearch,setEmertimiSearch] = useState()
    const [shumaSearch,setShumaSearch] = useState()
    const [filteredShpenzimet,setFilteredShpenzimet] = useState({})
    const [showModalPerPyetje,setShowModalPerPyetje] = useState(false)
    const [dataPerNdryshim,setDataPerNdryshim] = useState()
    const [showModalPerNdryshim,setShowModalPerNdryshim] = useState(false)
    const [dataPerDelete,setDataPerDelete] = useState()
    const showToast = useToast()
    const [triggerReload,setTriggerReload] = useState(false)
    const {updateAuthData} = useContext(AuthProvider)


      useEffect(() => {
    
       
        fetchData()
       if(authData.aKaUser == 'admin'){
        setStartDate(localTodayDate)
        setEndDate(localTodayDate)
       }

    
      }, [triggerReload,authData.reloadShpenzimi]);
    
      const fetchData = async () => {
        setLoading(true)
       try{
        await window.api.fetchTableShpenzimet().then(receivedData => {
          setShpenzimet(receivedData);
          console.log('receivedData:', receivedData);
         
        });
       }catch(e){
        console.log(e)
       }finally{
        setLoading(false)
        updateAuthData({reloadLayout:!authData.reloadLayout})

       }
    }

    useEffect(() => {
       filtroShpenzimet()
      }, [startDate, endDate, shpenzimet,shifraSearch,emertimiSearch,shumaSearch,shpenzimet]);
    
      const filtroShpenzimet = () => {
        if (shpenzimet.length > 0) {

            const normalizedStartDate = normalizoDaten(startDate);
            const normalizedEndDate = normalizoDaten(endDate);
    
            const dateFiltered = shpenzimet.filter(shpenzim => {
                const shpenzimDate = normalizoDaten(shpenzim.dataShpenzimit);
                return (!startDate || !endDate) || 
                       (shpenzimDate >= normalizedStartDate && shpenzimDate <= normalizedEndDate);
            });
    
        
            const finalFiltered = dateFiltered.filter(shpenzim => {
                const matchesShifra = shifraSearch
                    ? shpenzim.shifra?.toLowerCase().includes(shifraSearch.toLowerCase())
                    : true;
    
                const matchesEmertimi = emertimiSearch
                    ? shpenzim.emertimi?.toLowerCase().includes(emertimiSearch.toLowerCase())
                    : true;
    
                const matchesShuma = shumaSearch
                    ? String(shpenzim.shumaShpenzimit).includes(shumaSearch) 
                    : true;
    
                return matchesShifra && matchesEmertimi && matchesShuma;
            });
    
            setFilteredShpenzimet(finalFiltered);
        }
    };
    
    


    const handleEditShpenzimiClick = (e,item) =>{
        e.preventDefault()
        setDataPerNdryshim(item)
        setShowModalPerNdryshim(true)
      }

      const thirreModalPerPyetje = (item) =>{
       setDataPerDelete(item)
       setShowModalPerPyetje(true)
      }

      const handleConfirmModal = () =>{
        handleDeleteShpenzimi()
      }

      const handleDeleteShpenzimi = async () =>{
        let result
        setButtonLoading(true)
        try{
          let result
            setDataPerDelete({
              ...dataPerDelete,
              perdoruesiID:authData.perdoruesiID,
              nderrimiID:authData.nderrimiID
            })
            result = await window.api.anuloShpenzimin(dataPerDelete)
          
          
          if(result.success){
            showToast(`Shpenzimi eshte fshirë me sukses!`, 'success');
          }else{
            showToast(`Diqka shkoi keq!`, 'erorr');
          }

        }catch(e){
            console.log(e)
            showToast('Gabim gjate fshirjes: ' + result.error);

        }finally{
            setLoading(false)
            setButtonLoading(false)
            setTriggerReload(true)
        }
      }
      
  return (
   <Container>
    <Row className='d-flex flex-column mx-1'>

          <Col className='d-flex flex-row justify-content-center'>
            <h4 className='px-3 '>Shpenzimet brenda Periudhes :</h4>
            <Form.Group className='mx-1'>
              <Form.Control
                type='date'
                value={startDate}
                onChange={authData.aKaUser == 'admin' ? (e) => {setStartDate(e.target.value)} : null}
                readOnly = {authData.aKaUser != 'admin'}
              />
            </Form.Group>
            <Form.Group className='mx-1'>
              <Form.Control
                type='date'
                value={endDate}
                onChange={authData.aKaUser == 'admin' ? (e) => {setEndDate(e.target.value)} : null}
                readOnly = {authData.aKaUser != 'admin'}
              />
            </Form.Group>
          </Col>

          <Col className='d-flex flex-row justify-content-around m-3'>
            <FormGroup>
              <Form.Control placeholder='Kerko me Shifer...'  onChange={(e) => setShifraSearch(e.target.value)}/>
            </FormGroup>
            <FormGroup>
              <Form.Control  placeholder='Kerko me Emertim...'  onChange={(e) => setEmertimiSearch(e.target.value)}/>
            </FormGroup>
            <FormGroup>
              <Form.Control  placeholder='Kerko me Shumen e Shpenzuar...' onChange={(e) => setShumaSearch(e.target.value)}/>
            </FormGroup>
          </Col>

         <Col>
            {loading ? <AnimatedSpinner /> : <>
                {filteredShpenzimet.length > 0 ? (
                <div className='tabelaShpenzimeve'>
                <div className="table-responsive tabeleMeMaxHeight">
                <table className="table table-sm table-striped text-center text-nowrap">
                    <thead className="table-light">
                    <tr className='fs-5'>
                        <th scope="col">Nr</th>
                        <th scope="col">Shifra</th>
                        <th scope="col">Emertimi</th>
                        <th scope="col">Data dhe Ora</th>
                        <th scope="col">Shuma</th>
                        <th scope="col">Komenti</th>
                        <th scope="col">Perdoruesi</th>
                        <th scope="col">Menyra e Pageses</th>
                        <th scope="col">Opsionet</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredShpenzimet.slice().reverse().map((item, index) => (
                        <tr key={index}>
                        <th scope="row">{filteredShpenzimet.length - index}</th>
                        <td>{item.shifra}</td>
                        <td>{item.emertimi}</td>
                        <td>{formatLongDateToAlbanian(item.dataShpenzimit)} / {item.dataShpenzimit.toLocaleTimeString() } </td>
                        <td>{item.shumaShpenzimit.toFixed(2)} €</td>
                        <td>{item.komenti}</td>
                        <td>{item.perdoruesi}</td>
                        <td>{item.menyraPageses || ''}</td>
                        <td>
                            <Button variant='btn btn-outline-primary' onClick={(e) => handleEditShpenzimiClick(e,item)}><FontAwesomeIcon icon={faEdit}/></Button>
                            <Button variant='btn btn-outline-danger' className='mx-1' onClick={() => thirreModalPerPyetje(item)}><FontAwesomeIcon icon={faTrashCan}/></Button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
            ): (
                <h5 className='text-center mt-5 text-danger'>
                    Nuk Egzistojne te Dhena ne kete Interval Kohor !
                </h5>
            )}
            </>}
         </Col>
        </Row>

        <ModalPerPyetje show={showModalPerPyetje} handleClose={() => setShowModalPerPyetje(false)} handleConfirm={handleConfirmModal} />
        <NdryshoShpenzimin show = {showModalPerNdryshim} handleClose = {() => {setShowModalPerNdryshim(false); fetchData()}} dataPerNdryshim = {dataPerNdryshim} />

        <ToastContainer />
   </Container>
  )
}
