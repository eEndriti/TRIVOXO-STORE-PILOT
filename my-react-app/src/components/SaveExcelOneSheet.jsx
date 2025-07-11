import React,{useState} from 'react'
import { Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExcel } from '@fortawesome/free-solid-svg-icons'
import { useToast } from './ToastProvider';
import { useTranslation } from 'react-i18next';

export default function saveExcelOneSheet({data,fileName}) {

 const {t} = useTranslation('others')
const [meMaus,setMeMaus] = useState(false)
const showToast = useToast()

let isoFmt = new Intl.DateTimeFormat('sv-SE').format(new Date());
let fullFileName = `${fileName}__${isoFmt}.xlsx`

    const handleExport = async () => {
        const result = await window.api.saveExcel({
          data,
          fileName: fullFileName
        })
    
        if (result.success) {
          showToast( t('Excel u Ruajt me sukses ne ')+` :${result.filePath}`, 'success')
        } else {
          showToast(t('Excel nuk u Ruajt!'), 'error')
        }
      }

  return (
    <div className="text-end my-3">
    <Button variant="btn btn-outline-success" onClick={() => handleExport()} onMouseEnter={(e) => setMeMaus(true)} onMouseLeave={(e) => setMeMaus(false)}>
      <FontAwesomeIcon icon={faFileExcel}  className= {`mx-2 ${meMaus ? 'primary' : 'success'}`} />
        {t('Eksporto ne Excel')} 
    </Button>
  </div>
  )
}
