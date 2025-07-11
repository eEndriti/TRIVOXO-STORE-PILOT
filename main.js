const { app, BrowserWindow, ipcMain,dialog,shell } = require('electron');
const path = require('path');
const sql = require('mssql');
const { loadConfig,saveConfig } = require('./configManager');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { table } = require('console');
const XLSX = require('xlsx')

const dbConfig = loadConfig();

const config = {
  server: dbConfig.server,
  database: dbConfig.database,
  user: dbConfig.user,
  password: dbConfig.password,
  options: {
    encrypt: dbConfig.encrypt === true,
    trustServerCertificate: dbConfig.trustServerCertificate === true
  }
};

// MSSQL connection configuration
/*
const config = {
  server: 'DESKTOP-RJASQGG',
  database: 'berdynaTechDBKryesore',
  user: 'user1',
  password: '12345',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};*/

async function hashData(plainTextPassword) {
  try {
    const saltRounds = 10;

    // Generate the salt
    const salt = await bcrypt.genSalt(saltRounds);
    
    // Generate the hash using the salt
    const hash = await bcrypt.hash(plainTextPassword, salt);
    
    // Return both the salt and hash
    return { success: true, salt, hash };
  } catch (error) {
    console.error('Error generating hash and salt:', error);
    return { success: false, error: error.message };
  }
}


async function getDateTime() {
  const apiUrl = 'https://worldtimeapi.org/api/timezone/Europe/Skopje'; // World Time API endpoint for datetime

  try {
    // Fetch the datetime from the World Time API
    const response = await fetch(apiUrl);
    console.log('res',response)
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const datetime = new Date(data.datetime);

    // Convert to Kosovo timezone
    const kosovoTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Skopje', // Kosovo timezone
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(datetime);

    // Format parts into SQL-compatible format (YYYY-MM-DD HH:MM:SS)
    const formattedForSQL = `${kosovoTime[4].value}-${kosovoTime[2].value}-${kosovoTime[0].value} ${kosovoTime[6].value}:${kosovoTime[8].value}:${kosovoTime[10].value}`;
    return formattedForSQL;
  } catch (error) {
    console.error('Failed to fetch datetime from online server:', error);

    // Fallback to local system time in Kosovo timezone
    const localTime = new Date();
    const kosovoTimeFallback = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Prague', // Kosovo timezone
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(localTime);

    const fallbackForSQL = `${kosovoTimeFallback[4].value}-${kosovoTimeFallback[2].value}-${kosovoTimeFallback[0].value} ${kosovoTimeFallback[6].value}:${kosovoTimeFallback[8].value}:${kosovoTimeFallback[10].value}`;
    return fallbackForSQL;
  }
}


async function verifyHashData(input, storedHash) {
  try {
    // Compare the input password with the stored hash
    const isMatch = await bcrypt.compare(input, storedHash);

    if (isMatch) {
      return { success: true, message: 'Fjalekalimi i sakte' };
    } else {
      return { success: false, message: 'Fjalekalimi i gabuar' };
    }
  } catch (error) {
    console.error('Error verifying:', error);
    return { success: false, message: error.message };
  }
}

ipcMain.handle('login', async (event, data) => {
  let connection;
  try {
    connection = await sql.connect(config);

    // Query to get the user by their ID
    const result = await connection.request()
      .input('perdoruesiID', sql.Int, data.perdoruesiID)
      .query('SELECT * FROM Perdoruesi WHERE perdoruesiID = @perdoruesiID');

    if (result.recordset.length === 0) {
      return { success: false, message: 'Nuk Egziston Perdoruesi!' };
    }

    const user = result.recordset[0];

    const matchResult = await verifyHashData( data.fjalekalimi, user.fjalekalimiHash);

    if (!matchResult.success) {
      return { success: false, message: matchResult.message }; 
    }

    return {
      success: true,
      perdoruesiID: user.perdoruesiID,
      emertimi: user.emri,
      roli: user.roli
    };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, message: error.message };
  }  
});

async function fetchTablePerdoruesi() {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM perdoruesi`;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}

ipcMain.handle('fetchTablePerdoruesi', async () => {
  const data = await fetchTablePerdoruesi();
  return data;
});

async function fetchTableLogs() {
  try {
    await sql.connect(config);
    const result = await sql.query`
   SELECT l.logsID,l.komponenta,l.dataDheOra,n.numriPercjelles,l.perdoruesiID,l.pershkrimi,p.emri as 'perdoruesi' FROM logs l
join perdoruesi p on l.perdoruesiID = p.perdoruesiID
join nderrimi n on n.nderrimiID = l.nderrimiID`;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}

ipcMain.handle('fetchTableLogs', async () => {
  const data = await fetchTableLogs();
  return data;
});

const ndryshoGjendjenEArkes = async (menyraPagesesID, shuma, veprimi, nderrimiID, connection,perdoruesiID) => {
  const queryMenyraPagesesID = `SELECT menyraPagesesID FROM menyraPageses m WHERE m.asociuarMeArken = 1`;

  const request = connection.request();

  const resultMenyraPagesesID = await request.query(queryMenyraPagesesID);

  const fetchedMenyraPagesesID = resultMenyraPagesesID.recordset[0].menyraPagesesID;

  if (fetchedMenyraPagesesID == menyraPagesesID) {
    const query = `UPDATE nderrimi SET totaliArkes = totaliArkes ${veprimi} ${shuma} WHERE nderrimiID = ${nderrimiID}`;

    await request.query(query);
    await insertLogs({
      perdoruesiID: perdoruesiID, 
      komponenta: 'Ndryshimi i gjendjes se arkes',
      pershkrimi: `Nderro gjendjen e arkes me ${veprimi} ${shuma}`,
      nderrimiID: nderrimiID
    });
  }
}


async function fetchTablePunonjesit() {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM punonjesit`;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}

ipcMain.handle('fetchTablePunonjesit', async () => {
  const data = await fetchTablePunonjesit();
  return data;
});

async function fetchTableNderrimi() {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM nderrimi`;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}

ipcMain.handle('fetchTableNderrimi', async () => {
  const data = await fetchTableNderrimi();
  return data;
});

async function kontrolloNderriminAktual() {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT TOP 1 * FROM nderrimi WHERE iHapur = 1 ORDER BY dataFillimit DESC`;
    console.log(result.recordset.length > 0 ? result.recordset[0] : null)
    return result.recordset.length > 0 ? result.recordset[0] : null;
  } catch (err) {
    console.error('Error retrieving current shift:', err);
    return null;
  } finally {
       
  }
}

ipcMain.handle('kontrolloNderriminAktual', async () => {
  const shift = await kontrolloNderriminAktual();
  return shift;
});

async function filloNderriminERi(perdoruesiID, avans) {
 const today = new Date();
const yyyy = today.getFullYear();
const mm   = String(today.getMonth()+1).padStart(2,'0');
const dd   = String(today.getDate()).padStart(2,'0');
const currentDate = await getDateTime()
  
  try {
    await sql.connect(config);

    // Kontrollojm sa nderrime egzistojne per daten aktuale 
    console.log('datetime',currentDate)
    const result = await sql.query`
      SELECT COUNT(*) AS shiftCount
      FROM nderrimi
      WHERE CONVERT(date, dataFillimit) = ${currentDate}`;

    // e Llogaritim numri Percjelles
    const shiftCount = result.recordset[0].shiftCount;
    console.log('Numri i nderrimeve per daten aktuale:', shiftCount,'data result',result);
    const numriPercjelles = shiftCount + 1;

    // i insertojme te dhenat e reja
    const result2 = await sql.query`
        INSERT INTO nderrimi (perdoruesiID, dataFillimit, avansi, numriPercjelles, iHapur, totaliArkes)
        OUTPUT INSERTED.nderrimiID
        VALUES (${perdoruesiID}, ${currentDate}, ${avans}, ${numriPercjelles}, 1, 0)
      `;

      // Access the inserted id from the recordset
      const insertedId = result2.recordset[0].nderrimiID;

    
      await insertLogs({
        perdoruesiID: perdoruesiID, 
        komponenta: 'Nderrimi',
        pershkrimi: `Fillo nderrimin e ri me numrin percjelles ${numriPercjelles} `,
        nderrimiID: insertedId
      });
    } catch (err) {
    console.error('Error starting new shift:', err);
  } finally {
       
  }
}

ipcMain.handle('filloNderriminERi', async (event, perdoruesiID, avans) => {
  await filloNderriminERi(perdoruesiID, avans);
});

async function mbyllNderriminAktual(data) {
  const currentDate =await getDateTime()

  try {
    await sql.connect(config);
    await sql.query`
      UPDATE nderrimi
      SET dataMbarimit = ${currentDate}, iHapur = 0
      WHERE iHapur = 1`;

    // Return success
    const perdoruesiID = () => {
      if(data.perdoruesiID != undefined){
        return data.perdoruesiID
      }
      return ''
    }
    await insertLogs({
      perdoruesiID: perdoruesiID(), 
      komponenta: 'Nderrimi',
      pershkrimi: `Mbyll nderrimin e aktual `,
      nderrimiID: data.nderrimiID
    });
    return { success: true };
  } catch (err) {
    console.error('Error closing current shift:', err);
    // Return failure with error message
    return { success: false, error: err.message };
  } finally {
       
  }
}

ipcMain.handle('mbyllNderriminAktual', async () => {
  const result = await mbyllNderriminAktual();
  return result; // Ensure the result is returned to the renderer process
});


async function fetchTableTransaksionet() {
  try {
    await sql.connect(config);
    const result = await sql.query`
      select t.* ,p.emri as 'perdoruesi',n.numriPercjelles from transaksioni t
      join Perdoruesi p on p.perdoruesiID = t.perdoruesiID
      join nderrimi n on n.nderrimiID = t.nderrimiID`
      ;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTableTransaksionet', async () => {
  const data = await fetchTableTransaksionet();
  return data;
});

async function fetchDetailedTransactions() {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT 
          t.*,
          p.emri            AS perdoruesi,
          n.numriPercjelles,
          m.menyraPagesesID,
          mp.emertimi as 'emertimiMenyresPageses'
        FROM transaksioni t
          INNER JOIN Perdoruesi p
            ON p.perdoruesiID = t.perdoruesiID
          INNER JOIN nderrimi n
            ON n.nderrimiID   = t.nderrimiID

          -- all the “primary” transaction‐type tables
          LEFT JOIN shpenzimi             shp ON shp.transaksioniID = t.transaksioniID
          LEFT JOIN bonusetPunonjesit     bn  ON bn.transaksioniID  = t.transaksioniID
          LEFT JOIN paga                  pg  ON pg.transaksioniID  = t.transaksioniID
          LEFT JOIN blerje                bl  ON bl.transaksioniID  = t.transaksioniID
          LEFT JOIN shitje                sh  ON sh.transaksioniID  = t.transaksioniID
          LEFT JOIN servisimi             sv  ON sv.transaksioniID  = t.transaksioniID

          -- the “additional payment” cases
          LEFT JOIN pagesa                ps  ON ps.transaksioniID  = t.transaksioniID

          -- pick the right menyraPagesesID:
          CROSS APPLY (
            SELECT CASE
              -- for those “Pagese per …” transactions, use pagesa.menyraPagesesID
              WHEN t.lloji LIKE 'Pagese per Blerje%' 
                OR t.lloji LIKE 'Pagese per Shitje%' 
                OR t.lloji LIKE 'Pagese per Servisimi%' 
              THEN ps.menyraPagesesID

              -- otherwise fall back to whichever domain table has it
              ELSE COALESCE(
                shp.menyraPagesesID,
                bn.menyraPagesesID,
                pg.menyraPagesesID,
                bl.menyraPagesesID,
                sh.menyraPagesesID,
                sv.menyraPagesesID
              )
            END AS menyraPagesesID
          ) AS m

          -- finally, get the human‐readable name
          LEFT JOIN menyraPageses mp
            ON mp.menyraPagesesID = m.menyraPagesesID
        ;
`
      ;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchDetailedTransactions', async () => {
  const data = await fetchDetailedTransactions();
  return data;
});

async function fetchTableQuery(query) {
  try {
    await sql.connect(config);
    const result = await sql.query(query);
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } 
}

ipcMain.handle('fetchTableQuery', async (event, query) => {
  const data = await fetchTableQuery(query);
  return data;
});

async function fetchTotaliArkes(nderrimiID) {
  try {
    await sql.connect(config);
    const result = await sql.query(`select SUM(t.totaliIPageses) as 'totaliArkes' from transaksioni t where t.nderrimiID = ${nderrimiID}`);
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } 
}


ipcMain.handle('fetchTotaliArkes', async (event, nderrimiID) => {
  const data = await fetchTotaliArkes(nderrimiID);
  return data;
});

async function fetchTableParametrat() {
  try {
    await sql.connect(config);
    const result = await sql.query`
       Select * from parametratGarancionit
        `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTableParametrat', async () => {
  const data = await fetchTableParametrat();
  return data;
});

async function fetchTableShitje() {
  try {
    await sql.connect(config);
    const result = await sql.query`
        select sh.shitjeID,sh.shifra,sh.lloji,sh.komenti,sh.totaliPerPagese,sh.totaliPageses,
        sh.mbetjaPerPagese,sh.dataShitjes,sh.menyraPagesesID,sh.perdoruesiID,
        sh.transaksioniID,sh.kohaGarancionit,s.emertimi as 'subjekti',sh.subjektiID,m.emertimi as 'menyraPageses',p.emri as 'perdoruesi',n.numriPercjelles,n.dataFillimit,sho.nrPorosise,sho.statusi,pr.profitiID from shitje sh
        join subjekti s on s.subjektiID = sh.subjektiID
        join menyraPageses m on m.menyraPagesesID = sh.menyraPagesesID
        join Perdoruesi p on p.perdoruesiID = sh.perdoruesiID
        join nderrimi n on n.nderrimiID = sh.nderrimiID
		    join profiti pr on pr.transaksioniID = sh.transaksioniID
        left join shitjeOnline sho on sho.shitjeID  = sh.shitjeID
        `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTableShitje', async () => {
  const data = await fetchTableShitje();
  return data;
});

async function fetchTableShitjeOnline() {
  try {
    await sql.connect(config);
    const result = await sql.query`
        select sh.shitjeID,sh.shifra,sh.lloji,sh.komenti,sh.totaliPerPagese,sh.totaliPageses,
        sh.mbetjaPerPagese,sh.dataShitjes,sh.menyraPagesesID,sh.perdoruesiID,
        sh.transaksioniID,sh.kohaGarancionit,s.emertimi as 'subjekti',sh.subjektiID,m.emertimi as 'menyraPageses',p.emri as 'perdoruesi',n.numriPercjelles,n.dataFillimit,sho.nrPorosise,sho.profitiID,sho.statusi from shitje sh
        join subjekti s on s.subjektiID = sh.subjektiID
        join menyraPageses m on m.menyraPagesesID = sh.menyraPagesesID
        join Perdoruesi p on p.perdoruesiID = sh.perdoruesiID
        join nderrimi n on n.nderrimiID = sh.nderrimiID
		    join shitjeOnline sho on sho.shitjeID = sh.shitjeID
        `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTableShitjeOnline', async () => {
  const data = await fetchTableShitjeOnline();
  return data;
});

async function fetchTablePagat() {
  try {
    await sql.connect(config);
    const result = await sql.query`
        select p.pagaID,p.punonjesID,p.dataPageses,p.paga,p.bonusi,p.zbritje,pn.emri,m.emertimi as 'menyraPageses',p.shifra from paga p
        join punonjesit pn on pn.punonjesID = p.punonjesID
		    join menyraPageses m on m.menyraPagesesID = p.menyraPagesesID
        `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTablePagat', async () => {
  const data = await fetchTablePagat();
  return data;
});

async function fetchTableBonuset() {
  try {
    await sql.connect(config);
    const result = await sql.query`
        select * from bonuset
        `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTableBonuset', async () => {
  const data = await fetchTableBonuset();
  return data;
});

async function fetchTablePushimet() {
  try {
    await sql.connect(config);
    const result = await sql.query`
        select * from pushimet
        `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTablePushimet', async () => {
  const data = await fetchTablePushimet();
  return data;
});

async function fetchTableBlerje() {
  try {
    await sql.connect(config);
    const result = await sql.query`
      select b.blerjeID,b.shifra,b.totaliPerPagese,b.totaliPageses,b.mbetjaPerPagese,b.dataBlerjes,
      b.dataFatures,b.komenti,b.fatureERregullt,b.nrFatures,p.emri as 'perdoruesi',s.subjektiID,s.emertimi as 'klienti',m.emertimi as 'menyraPagesese',b.transaksioniID,n.numriPercjelles,n.dataFillimit from Blerje b

        join perdoruesi p on p.perdoruesiID = b.perdoruesiID
        join subjekti s on s.subjektiID = b.subjektiID
        join menyraPageses m on m.menyraPagesesID = b.menyraPagesesID
        join nderrimi n on n.nderrimiID = b.nderrimiID
`;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTableBlerje', async () => {
  const data = await fetchTableBlerje();
  return data;
});

async function fetchTablePagesa() {
  try {
    await sql.connect(config);
    const result = await sql.query`
      select p.pagesaID,p.shumaPageses,p.dataPageses,p.shifra,p.transaksioniID,p.subjektiID,p.menyraPagesesID,s.emertimi as 'subjekti',m.emertimi as 'menyraPageses' from pagesa p
	join subjekti s on s.subjektiID = p.subjektiID
	join menyraPageses m on m.menyraPagesesID  = p.menyraPagesesID
`;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTablePagesa', async () => {
  const data = await fetchTablePagesa();
  return data;
});

async function fetchTableSubjekti(lloji) {
  try {
    let tabela = '';
    if (lloji === 'klient') {
      tabela = 'shitje';
    } else if (lloji === 'furnitor') {
      tabela = 'blerje';
    } else {
      throw new Error('Invalid lloji parameter');
    }

    await sql.connect(config);
    const result = await sql.query(`
      SELECT s.subjektiID, s.lloji, s.emertimi, s.kontakti,
             COALESCE(SUM(sh.totaliPerPagese), 0) AS totalTotaliPerPagese,
             COALESCE(SUM(sh.totaliPageses), 0) AS totalTotaliPageses,
             COALESCE(SUM(sh.mbetjaPerPagese), 0) AS totalMbetjaPerPagese
      FROM subjekti s
      LEFT JOIN ${tabela} sh ON s.subjektiID = sh.subjektiID
      GROUP BY s.subjektiID, s.emertimi, s.kontakti, s.lloji;
    `);
    
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return []; // Consider returning a more informative response if needed
  } finally {
       
  }
}

ipcMain.handle('fetchTableSubjekti', async (event, lloji) => {
  const data = await fetchTableSubjekti(lloji);
  return data;
});


async function fetchTableServisi() {
  try {
    await sql.connect(config);
    const result = await sql.query`
    select s.servisimiID,s.shifra,s.kontakti,s.komenti,s.pajisjetPercjellese,s.dataPranimit,s.statusi,s.shifraGarancionit,
    s.totaliPerPagese,s.totaliPageses,s.mbetjaPageses,s.dataPerfundimit,s.perdoruesiID,s.nderrimiID,s.transaksioniID,s.subjektiID,s.menyraPagesesID,
	p.emri as 'perdoruesi',sb.emertimi as 'subjekti' from servisimi s
    join subjekti sb on s.subjektiID = sb.subjektiID
	join Perdoruesi p on p.perdoruesiID = s.perdoruesiID
    `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTableServisi', async () => {
  const data = await fetchTableServisi();
  return data;
});

async function fetchTableProdukti() {
  try {
    await sql.connect(config);
    const result = await sql.query`
    select  p.produktiID,p.shifra,p.emertimi,p.pershkrimi,p.sasia,p.cmimiBlerjes,p.cmimiShitjes,p.dataKrijimit,p.komenti,p.meFatureTeRregullt,p.cpu,p.ram,p.gpu,p.disku,p.sasiStatike,k.emertimi as 'emertimiKategorise',k.tvsh,k.kategoriaID from produkti p
    join kategoria k on k.kategoriaID = p.kategoriaID
    `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTableProdukti', async () => {
  const data = await fetchTableProdukti();
  return data;
});

async function fetchTableKategoria() {
  try {
    await sql.connect(config);
    const result = await sql.query`
    
      SELECT 
          k.kategoriaID,
          k.emertimi,
          k.tvsh,
          k.komponenta,
          COUNT(p.produktiID) AS total_produkte,
          SUM(p.sasia) AS total_sasia
      FROM 
          kategoria k
      LEFT JOIN 
          produkti p ON k.kategoriaID = p.kategoriaID
      GROUP BY 
          k.kategoriaID, k.emertimi, k.tvsh, k.komponenta;

    `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } 
}
ipcMain.handle('fetchTableKategoria', async () => {
  const data = await fetchTableKategoria();
  return data;
});


async function getTransferetBankare() {
  try {
    await sql.connect(config);
    const result = await sql.query`
    
     SELECT
        t.*,
        mpFrom.emertimi AS ngaMenyraPageses,
        mpTo.emertimi   AS neMenyraPageses,
        p.emri as perdoruesi,
        n.numriPercjelles
      FROM transferetBankare AS t
      LEFT JOIN menyraPageses AS mpFrom
        ON t.ngaMenyraPagesesID = mpFrom.menyraPagesesID
      LEFT JOIN menyraPageses AS mpTo
        ON t.neMenyraPagesesID  = mpTo.menyraPagesesID
      JOIN Perdoruesi p
        on p.perdoruesiID = t.perdoruesiID
      JOIN nderrimi n
        on n.nderrimiID = t.nderrimiID
      ORDER BY t.dataTransferit DESC;



    `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } 
}
ipcMain.handle('getTransferetBankare', async () => {
  const data = await getTransferetBankare();
  return data;
});

async function fetchTableMenyratPageses() {
  try {
    await sql.connect(config);
    const result = await sql.query`
        select b.balanciID,b.shuma,b.menyraPagesesID,m.emertimi from balanci b
    join menyraPageses m on m.menyraPagesesID = b.menyraPagesesID
    `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTableMenyratPageses', async () => {
  const data = await fetchTableMenyratPageses();
  return data;
});

async function fetchTableLlojetShpenzimeve() {
  try {
    await sql.connect(config);
    const result = await sql.query`
        SELECT 
        llojetShpenzimeve.*, 
        COUNT(shpenzimi.shpenzimiID) AS total_shpenzime
    FROM 
        llojetShpenzimeve
    LEFT JOIN 
        shpenzimi ON shpenzimi.llojetShpenzimeveID = llojetShpenzimeve.llojetShpenzimeveID
    GROUP BY 
        llojetShpenzimeve.llojetShpenzimeveID,
        llojetShpenzimeve.emertimi,
        llojetShpenzimeve.shumaStandarde
    `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTableLlojetShpenzimeve', async () => {
  const data = await fetchTableLlojetShpenzimeve();
  return data;
});

async function fetchTableShpenzimet() {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT 
  sh.shpenzimiID,
  sh.shifra,
  sh.shumaShpenzimit,
  sh.dataShpenzimit,
  sh.nenLloji,
  sh.komenti,
  lsh.llojetShpenzimeveID,
  lsh.emertimi        AS llojShpenzimi,
  lsh.shumaStandarde,
  p.emri              AS perdoruesi,
  t.transaksioniID,
  -- if there's no payment method, show 'Pa përcaktuar' instead of NULL
  COALESCE(m.emertimi, 'Pa përcaktuar') AS menyraPageses,
  sh.menyraPagesesID
FROM shpenzimi sh
JOIN llojetShpenzimeve lsh 
  ON sh.llojetShpenzimeveID = lsh.llojetShpenzimeveID
JOIN Perdoruesi p 
  ON sh.perdoruesiID = p.perdoruesiID
JOIN transaksioni t 
  ON sh.transaksioniID = t.transaksioniID

-- changed to LEFT JOIN so NULLs in sh.menyraPagesesID still appear
LEFT JOIN menyraPageses m 
  ON m.menyraPagesesID = sh.menyraPagesesID;

    `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTableShpenzimet', async () => {
  const data = await fetchTableShpenzimet();
  return data;
});

async function fetchTableProfiti() {
  try {
    await sql.connect(config);
    const result = await sql.query`
     SELECT p.profitiID, p.shuma, p.nderrimiID, p.transaksioniID, t.lloji,t.dataTransaksionit,t.nderrimiID
      FROM profiti p
      JOIN transaksioni t ON t.transaksioniID = p.transaksioniID
      LEFT JOIN shitje sh ON sh.transaksioniID = t.transaksioniID AND t.lloji = 'Shitje'
      LEFT JOIN servisimi s ON s.transaksioniID = t.transaksioniID AND t.lloji = 'Servisim'
      WHERE t.lloji = 'Shitje' OR t.lloji = 'Servisim';

    `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } finally {
       
  }
}
ipcMain.handle('fetchTableProfiti', async () => {
  const data = await fetchTableProfiti();
  return data;
});

async function fetchTableProfitiDitor() {
  const dataSot = await getDateTime()
  
  try {
    await sql.connect(config);

    const result = await sql.query`
     SELECT p.profitiID, p.shuma, p.nderrimiID, p.transaksioniID, t.lloji,t.dataTransaksionit,t.nderrimiID,p.shumaPerBonuse
      FROM profiti p
      JOIN transaksioni t ON t.transaksioniID = p.transaksioniID
      LEFT JOIN shitje sh ON sh.transaksioniID = t.transaksioniID AND t.lloji = 'Shitje'
      LEFT JOIN servisimi s ON s.transaksioniID = t.transaksioniID AND t.lloji = 'Servisim'
      WHERE (t.lloji = 'Shitje' OR t.lloji = 'Servisim') and  CAST(t.dataTransaksionit AS DATE) = ${dataSot} and p.statusi = 0


    `;
    return result.recordset;
  } catch (err) {
    console.error('Error retrieving data:', err);
    return [];
  } 
}

ipcMain.handle('fetchTableProfitiDitor', async () => {
  const data = await fetchTableProfitiDitor();
  return data;
});

 const shifra = '' // ketu incializohet shifra globale, pastaj thirret prej ciles tabele kemi nevoje.

 async function generateNextShifra(tabela, shtojca, connection) {
  const vitiAktual = new Date().getFullYear();
  let emertimiDates;
  switch (shtojca) {
    case 'SH':  emertimiDates = 'dataShitjes';    break;
    case 'B':   emertimiDates = 'dataBlerjes';   break;
    case 'S':   emertimiDates = 'dataPranimit';  break;
    case 'P':   emertimiDates = 'dataKrijimit';  break;
    case 'SHP': emertimiDates = 'dataShpenzimit';break;
    case 'PG':  emertimiDates = 'dataPageses';   break;
    case 'BN':  emertimiDates = 'dataPageses';   break;
    case 'TB':  emertimiDates = 'dataTransferit';break;
    default:
      throw new Error(`Unknown shtojca "${shtojca}"`);
  }

  if (!connection.connected) {
    await connection.connect();
  }

  const countResult = await connection.request().query(`
    SELECT COUNT(*) AS cnt
    FROM ${tabela}
    WHERE YEAR(${emertimiDates}) = ${vitiAktual}
  `);
  let nextSeq = countResult.recordset[0].cnt + 1;  

  const twoDigitYY = String(vitiAktual).slice(-2);
  let nextShifra;
  while (true) {
    nextShifra = `${shtojca}-${twoDigitYY}${nextSeq}`;
    const existsResult = await connection.request()
      .input('shifra', sql.VarChar(50), nextShifra)
      .query(`
        SELECT COUNT(*) AS cnt
        FROM ${tabela}
        WHERE shifra = @shifra
      `);

    if (existsResult.recordset[0].cnt === 0) {
      break;           
    }
    nextSeq += 1;      
  }

  return nextShifra;
}


async function insertLogs(data){
  let connection;
  let dataDheOra
  try {
    dataDheOra = await getDateTime(); 
    // Connect to the database
    connection = await sql.connect(config);

    const insertLogs = `
      INSERT INTO logs (
        perdoruesiID, komponenta, pershkrimi, dataDheOra, nderrimiID
      ) VALUES (
        @perdoruesiID, @komponenta, @pershkrimi, @dataDheOra, @nderrimiID
      )
    `;
    const logsResult = await connection.request()
      .input('perdoruesiID', sql.Int, data.perdoruesiID)
      .input('komponenta', sql.VarChar, data.komponenta)
      .input('pershkrimi', sql.VarChar, data.pershkrimi)
      .input('dataDheOra', sql.DateTime, dataDheOra)
      .input('nderrimiID', sql.Int, data.nderrimiID)
      .query(insertLogs);

    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
}

ipcMain.handle('shtoPerdoruesin', async (event, data) => {
  let connection;
  try {
    connection = await sql.connect(config);

    const { success, hash, salt, error } = await hashData(data.fjalekalimi);

    if (!success) {
      return { success: false, error: error };
    }

    const insert = `
      INSERT INTO Perdoruesi (
        emri, fjalekalimiHash, salt, roli
      ) VALUES (
        @emri, @fjalekalimiHash, @salt, @roli
      )
    `;
    await connection.request()
      .input('emri', sql.VarChar, data.emri)
      .input('fjalekalimiHash', sql.VarChar, hash)
      .input('salt', sql.VarChar, salt)
      .input('roli', sql.VarChar, data.roli)
      .query(insert);

      await insertLogs({
        perdoruesiID: data.perdoruesiID, 
        komponenta: 'Perdoruesit',
        pershkrimi: `Shto perdoruesin ${data.emri}`,
        nderrimiID: data.nderrimiID
      })
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('shtoOpsionPagese', async (event, data) => {
  let connection;
  try {
    connection = await sql.connect(config);

    const insert = `
      INSERT INTO menyraPageses (
        emertimi
      ) OUTPUT INSERTED.menyraPagesesID VALUES (
        @emertimi
      )
    `;

    const insertedResult  = await connection.request()
      .input('emertimi', sql.VarChar, data.emertimi)
      .query(insert);

      const menyraID = insertedResult.recordset[0].menyraPagesesID;

      const insertBalanci = `
      INSERT INTO balanci (
        shuma,menyraPagesesID
      ) OUTPUT INSERTED.menyraPagesesID VALUES (
        @shuma,@menyraPagesesID
      )
    `;

    await connection.request()
      .input('shuma', sql.VarChar, data.shuma)
      .input('menyraPagesesID', sql.Int, menyraID)
      .query(insertBalanci);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Menyra Pageses',
        pershkrimi: `Shto menyren e pageses ${data.emertimi}`,
        nderrimiID: data.nderrimiID
      })
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('shtoPunonjes', async (event, data) => {
  let connection;
  let dataDheOra
  try {
    dataDheOra = await getDateTime(); // Await the result of getDateTime
    // Connect to the database
    connection = await sql.connect(config);

    const insertPunonjesi = `
      INSERT INTO punonjesit (
        emri, mbiemri, dataPunësimit, pagaBaze, aktiv, nrTelefonit
      ) VALUES (
        @emri, @mbiemri, @dataPunësimit, @pagaBaze, @aktiv, @nrTelefonit
      )
    `;

    await connection.request()
      .input('emri', sql.VarChar, data.emri)
      .input('mbiemri', sql.VarChar, data.mbiemri)
      .input('dataPunësimit', sql.Date, dataDheOra)
      .input('pagaBaze', sql.Decimal(18, 2), data.pagaBaze)
      .input('aktiv', sql.Int, 1)
      .input('nrTelefonit', sql.Int, data.nrTelefonit)
      .query(insertPunonjesi);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Punonjesit',
        pershkrimi: `Shto punonjesin ${data.emri} ${data.mbiemri}`,
        nderrimiID: data.nderrimiID
      })
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

const insertTransaksionin = async (data,connection) => {
  console.log('dataPerTransaksion',data)

    const insertTransaksioniQuery = `
    INSERT INTO transaksioni (
      shifra, lloji, totaliPerPagese, totaliIPageses, mbetjaPerPagese, dataTransaksionit, perdoruesiID, nderrimiID, komenti,pershkrimi,eshtePublik
    ) OUTPUT INSERTED.transaksioniID VALUES (
      @shifra, @lloji, @totaliPerPagese, @totaliIPageses, @mbetjaPerPagese, @dataTransaksionit, @perdoruesiID, @nderrimiID, @komenti,@pershkrimi,@eshtePublik
    )
  `;
  const transaksioniResult = await connection.request()
    .input('shifra', sql.VarChar, data.shifra)
    .input('lloji', sql.VarChar, data.lloji)
    .input('totaliPerPagese', sql.Decimal(18, 2), data.totaliPerPagese)
    .input('totaliIPageses', sql.Decimal(18, 2), data.totaliIPageses)
    .input('mbetjaPerPagese', sql.Decimal(18, 2), data.mbetjaPerPagese)
    .input('dataTransaksionit', sql.DateTime, data.dataDheOra)
    .input('perdoruesiID', sql.Int, data.perdoruesiID)
    .input('nderrimiID', sql.Int, data.nderrimiID)
    .input('komenti', sql.VarChar, data.komenti)
    .input('pershkrimi', sql.VarChar, data.pershkrimi)
    .input('eshtePublik', sql.Bit, data.eshtePublik)
    .query(insertTransaksioniQuery);

  const transaksioniID = transaksioniResult.recordset[0].transaksioniID;

  await insertLogs({
    perdoruesiID: data.perdoruesiID,
    komponenta:'Transaksioni',
    pershkrimi: `Shto transaksionin ${transaksioniID}`,
    nderrimiID: data.nderrimiID
  })
  return transaksioniID
}

const updateLlojiIDTransaksion = async (llojiID,transaksioniID,connection) => {

  const updateTransaksioniQuery = `
  UPDATE transaksioni 
    set llojiID = @llojiID
    where transaksioniID = @transaksioniID
`;
  await connection.request()
    .input('llojiID', sql.Int, llojiID)
    .input('transaksioniID', sql.Int, transaksioniID)
    .query(updateTransaksioniQuery);

}

ipcMain.handle('insertShpenzimi', async (event, data) => {
  let connection;
  let dataDheOra
  try {
    dataDheOra = await getDateTime(); // Await the result of getDateTime
    // Connect to the database
    connection = await sql.connect(config);
    console.log('beffore')
    // Generate the next unique 'shifra' for transaksioni
    const shifra = await generateNextShifra('shpenzimi', 'SHP',connection);
    // Insert into the 'transaksioni' table and get the inserted ID
    console.log('done')
    const dataPerTransaksion = ({
      ...data,
      totaliPerPagese:data.shumaShpenzimit,
      totaliIPageses:data.shumaShpenzimit,
      shifra:shifra,
      dataDheOra,
      lloji:'Shpenzim',
      mbetjaPerPagese:0,
      eshtePublik:1
    })

    const transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)

    const insertShpenzimi = `
      INSERT INTO shpenzimi (
        shifra, shumaShpenzimit, dataShpenzimit, komenti, llojetShpenzimeveID, perdoruesiID, transaksioniID,menyraPagesesID
      ) OUTPUT INSERTED.shpenzimiID VALUES (
        @shifra, @shumaShpenzimit, @dataShpenzimit, @komenti, @llojetShpenzimeveID, @perdoruesiID, @transaksioniID,@menyraPagesesID
      )
    `;

    const shpenzimiResult = await connection.request()
      .input('shifra', sql.VarChar, shifra)
      .input('shumaShpenzimit', sql.Decimal(18,2), data.shumaShpenzimit)
      .input('dataShpenzimit', sql.DateTime, dataDheOra)
      .input('komenti', sql.VarChar, data.komenti)
      .input('llojetShpenzimeveID', sql.Int, data.llojetShpenzimeveID)
      .input('perdoruesiID', sql.Int, data.perdoruesiID)
      .input('transaksioniID', sql.Int, transaksioniID)
      .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
      .query(insertShpenzimi);

      const shpenzimiID = shpenzimiResult.recordset[0].shpenzimiID;

      await updateLlojiIDTransaksion(shpenzimiID,transaksioniID,connection)

      await ndryshoBalancin(data.menyraPagesesID, data.shumaShpenzimit, '-',connection,data.perdoruesiID,data.nderrimiID);
      await ndryshoGjendjenEArkes(data.menyraPagesesID,data.shumaShpenzimit,'-',data.nderrimiID,connection,data.perdoruesiID) 

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta:'Shpenzim',
        pershkrimi: `Shto Shpenzimin ${shpenzimiID}`,
        nderrimiID: data.nderrimiID
      })
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('kaloNgaStokuNeShpenzim', async (event, data) => {
  let connection;
  let dataDheOra
  try {
    dataDheOra = await getDateTime(); // Await the result of getDateTime
    // Connect to the database
    connection = await sql.connect(config);
    // Generate the next unique 'shifra' for transaksioni
    const shifra = await generateNextShifra('shpenzimi', 'SHP',connection);
    console.log(data)
    const dataPerTransaksion = ({
      ...data,
      totaliPerPagese:data.cmimiFurnizimit,
      totaliIPageses:data.cmimiFurnizimit,
      shifra:shifra,
      dataDheOra,
      komenti:'nga Stoku',
      lloji:'Shpenzim',
      mbetjaPerPagese:0,
      eshtePublik:1
    })
     
    const transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)

    const insertShpenzimi = `
      INSERT INTO shpenzimi (
        shifra, shumaShpenzimit, dataShpenzimit, komenti, llojetShpenzimeveID, perdoruesiID, transaksioniID,nenLloji
      ) OUTPUT INSERTED.shpenzimiID VALUES (
        @shifra, @shumaShpenzimit, @dataShpenzimit, @komenti, @llojetShpenzimeveID, @perdoruesiID, @transaksioniID,@nenLloji
      )
    `;
    console.log('transaksioniID',transaksioniID)

    const shpenzimiResult = await connection.request()
      .input('shifra', sql.VarChar, shifra)
      .input('shumaShpenzimit', sql.Decimal(18,2), data.cmimiFurnizimit)
      .input('dataShpenzimit', sql.DateTime, dataDheOra)
      .input('komenti', sql.VarChar, 'nga Stoku')
      .input('llojetShpenzimeveID', sql.Int, data.llojetShpenzimeveID)
      .input('perdoruesiID', sql.Int, data.perdoruesiID)
      .input('transaksioniID', sql.Int, transaksioniID)
      .input('nenLloji', sql.VarChar, 'ngaStoku')
      .query(insertShpenzimi);

      const shpenzimiID = shpenzimiResult.recordset[0].shpenzimiID;

      await updateLlojiIDTransaksion(shpenzimiID,transaksioniID,connection)

      const insertShpenzimProdukti = `
      INSERT INTO shpenzimProdukti (
        shpenzimiID, produktiID, sasia, cmimiFurnizimit,transaksioniID
      )  VALUES (
        @shpenzimiID, @produktiID, @sasia, @cmimiFurnizimit,@transaksioniID
      )
    `;

       await connection.request()
      .input('shpenzimiID', sql.Int, shpenzimiID)
      .input('produktiID', sql.Int, data.produktiID)
      .input('sasia', sql.Int, data.sasia)
      .input('cmimiFurnizimit', sql.Decimal(18,2), data.cmimiFurnizimit)
      .input('transaksioniID', sql.Int, transaksioniID)
      .query(insertShpenzimProdukti)



      const updateStoku = `
       UPDATE produkti
       SET sasia = sasia - @sasia
       WHERE produktiID = @produktiID
     `;
      console.log('para queryt')
     await connection.request()
       .input('sasia', sql.Int, data.sasia)
       .input('produktiID', sql.Int, data.produktiID)
       .query(updateStoku);
       console.log('mas queryt')

       await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta:'Shpenzim',
        pershkrimi: `Produkti u kalua nga stoki ne shpenzim`,
        nderrimiID: data.nderrimiID
       })
       console.log('mas logs')

    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});


ipcMain.handle('insertProduktin', async (event, data) => {
  let connection;
  let dataDheOra
  try {
    dataDheOra = await getDateTime(); // Await the result of getDateTime
    connection = await sql.connect(config);


    // Generate the next unique 'shifra' for transaksioni
    const shifra = await generateNextShifra('produkti', 'P',connection);

     // Connect to the database
    // Insert into the 'transaksioni' table and get the inserted ID

   
    const insertProdukti = `
      INSERT INTO produkti (
        shifra, emertimi, pershkrimi, sasia, cmimiBlerjes, cmimiShitjes, kategoriaID,dataKrijimit,komenti,cpu,ram,gpu,disku,meFatureTeRregullt,sasiStatike
      )  VALUES (
       @shifra, @emertimi, @pershkrimi, @sasia, @cmimiBlerjes, @cmimiShitjes, @kategoriaID,@dataKrijimit,@komenti,@cpu,@ram,@gpu,@disku,@meFatureTeRregullt,@sasiStatike
      )
    `;
    const meFature = data.meFature ? 'po' : 'jo'
    const sasia = data.sasiStatike ? 100 : data.sasia
    await connection.request()
      .input('shifra', sql.VarChar, shifra)
      .input('emertimi', sql.VarChar, data.emertimi)
      .input('pershkrimi', sql.VarChar, data.pershkrimi)
      .input('sasia', sql.Int, sasia)
      .input('cmimiBlerjes', sql.Decimal(18,2), data.cmimiBlerjes)
      .input('cmimiShitjes', sql.Decimal(18,2), data.cmimiShitjes)
      .input('kategoriaID', sql.Int, data.kategoriaID)
      .input('dataKrijimit', sql.DateTime, dataDheOra)
      .input('komenti', sql.VarChar, data.komenti)
      .input('cpu', sql.VarChar, data.cpu)
      .input('ram', sql.VarChar, data.ram)
      .input('gpu', sql.VarChar, data.gpu)
      .input('disku', sql.VarChar, data.disku)
      .input('meFatureTeRregullt', sql.VarChar, meFature)
      .input('sasiStatike', sql.Bit, data.sasiStatike)
      .query(insertProdukti);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta:'Produkti',
        pershkrimi: `U shtua produkti: ${data.emertimi}`,
        nderrimiID: data.nderrimiID
      })
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('ndryshoProduktin', async (event, data) => {
  let connection;
  let dataDheOra
  try {
    dataDheOra = await getDateTime(); // Await the result of getDateTime
    // Connect to the database
    connection = await sql.connect(config);
   
    const insertProdukti = `
     Update produkti 
        SET emertimi = @emertimi,
            pershkrimi = @pershkrimi,
            cmimiBlerjes = @cmimiBlerjes,
            cmimiShitjes = @cmimiShitjes,
            kategoriaID = @kategoriaID,
            komenti = @komenti,
            cpu = @cpu,
            ram = @ram,
            gpu = @gpu,
            disku = @disku,
            meFatureTeRregullt = @meFatureTeRregullt,
            sasiStatike = @sasiStatike
        where produktiID = @produktiID
`
    const meFature = data.meFature ? 'po' : 'jo'
    console.log('daaaaaaaaaaaaaaaadaaaaaaaa',data)
    await connection.request()
      .input('emertimi', sql.VarChar, data.emertimi)
      .input('pershkrimi', sql.VarChar, data.pershkrimi)
      .input('cmimiBlerjes', sql.Decimal(18,2), data.cmimiBlerjes)
      .input('cmimiShitjes', sql.Decimal(18,2), data.cmimiShitjes)
      .input('kategoriaID', sql.Int, data.kategoriaID)
      .input('komenti', sql.VarChar, data.komenti)
      .input('cpu', sql.VarChar, data.cpu)
      .input('ram', sql.VarChar, data.ram)
      .input('gpu', sql.VarChar, data.gpu)
      .input('disku', sql.VarChar, data.disku)
      .input('meFatureTeRregullt', sql.VarChar, meFature)
      .input('sasiStatike', sql.Int, data.sasiStatike)
      .input('produktiID', sql.Int, data.produktiID)
      .query(insertProdukti);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta:'Produkti',
        pershkrimi: `U ndryshua produkti: ${data.emertimi}`,
        nderrimiID: data.nderrimiID
      })
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('ndryshojeAvansinNderrimitAktual', async (event, data) => {
  let connection;
  let dataDheOra
  try {
    connection = await sql.connect(config);
   
    const updateAvansi = `
     Update nderrimi 
        SET avansi = @avansi   
        where nderrimiID = @nderrimiID
`
  
    await connection.request()
      .input('avansi', sql.Decimal(18,2), data.avansi)
      .input('nderrimiID', sql.Int, data.nderrimiID)
      .query(updateAvansi);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta:'Nderrimi',
        pershkrimi: `U ndryshua avansi i nderrimit: ${data.nderrimiID}`,
        nderrimiID: data.nderrimiID
      })
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('insertKategorine', async (event, data) => {
  let connection;
  try {
    // Connect to the database
    connection = await sql.connect(config);

    const insertKategorineQuery = `
      INSERT INTO kategoria (
        emertimi, tvsh, komponenta
      ) VALUES (
        @emertimi, @tvsh, @komponenta
      )
    `;
    const kategoriaResult = await connection.request()
      .input('emertimi', sql.VarChar, data.emertimi)
      .input('tvsh', sql.Int, data.tvsh)
      .input('komponenta',sql.VarChar,data.komponenta)
      .query(insertKategorineQuery);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Kategoria',
        pershkrimi: `U shtua kategoria: ${data.emertimi}`,
        nderrimiID: data.nderrimiID
      })
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('insertSubjekti', async (event, data) => {
  let connection;
  let dataDheOra = await getDateTime()
  try {
    // Connect to the database
    connection = await sql.connect(config);

    const insertSubjektiQuery = `
      INSERT INTO subjekti (
        emertimi, kontakti, lloji,dataKrijimit
      ) VALUES (
        @emertimi, @kontakti, @lloji,@dataKrijimit
      )
    `;
    const subjektiResult = await connection.request()
      .input('emertimi', sql.VarChar, data.emertimi)
      .input('kontakti', sql.Int, data.kontakti)
      .input('lloji',sql.VarChar,data.lloji)
      .input('dataKrijimit',sql.DateTime,dataDheOra)
      .query(insertSubjektiQuery);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Subjekti',
        pershkrimi: `U shtua subjekti: ${data.emertimi}`,
        nderrimiID: data.nderrimiID
      })
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('insertServisi', async (event, data) => {
  let connection;
  let dataDheOra
  try {
    dataDheOra = await getDateTime(); // Await the result of getDateTime
   // Connect to the database
   connection = await sql.connect(config);

    // Generate the next unique 'shifra' for transaksioni
    const shifra = await generateNextShifra('servisimi', 'S',connection);

     
   
    const insertServisimi = `
      INSERT INTO servisimi (
        shifra, kontakti, komenti, pajisjetPercjellese, dataPranimit, statusi, shifraGarancionit,perdoruesiID,nderrimiID,subjektiID
      )  VALUES (
        @shifra, @kontakti, @komenti, @pajisjetPercjellese, @dataPranimit, @statusi, @shifraGarancionit,@perdoruesiID,@nderrimiID,@subjektiID
      )
    `;

    await connection.request()
      .input('shifra', sql.VarChar, shifra)
      .input('kontakti', sql.VarChar, data.kontakti)
      .input('komenti', sql.VarChar, data.komenti)
      .input('pajisjetPercjellese', sql.VarChar, data.pajisjetPercjellese)
      .input('dataPranimit', sql.DateTime, dataDheOra)
      .input('statusi', sql.VarChar, data.statusi)
      .input('shifraGarancionit', sql.VarChar, data.shifraGarancionit)
      .input('perdoruesiID', sql.Int, data.perdoruesiID)
      .input('nderrimiID', sql.Int, data.nderrimiID)
      .input('subjektiID', sql.Int, data.subjektiID)
      .query(insertServisimi);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Servisimi',
        pershkrimi: `U shtua Servisi: ${shifra}`,
        nderrimiID: data.nderrimiID
      })
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('deleteSubjekti', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      const deleteSubjektiQuery = `
        DELETE FROM subjekti 
        WHERE subjektiID = @subjektiID
      `;

      await connection.request().input('subjektiID', sql.Int, data.subjektiID).query(deleteSubjektiQuery);
      
      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Subjekti',
        pershkrimi: `U fshi subjekti: ${data.emertimi}`,
        nderrimiID: data.nderrimiID
      })
      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('deleteOpsionPagese', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      const deleteFromBalanci = `
        DELETE FROM balanci 
        WHERE menyraPagesesID = @menyraPagesesID
      `;

      const deleteFromMenyraPagesave = `
        DELETE FROM menyraPageses 
        WHERE menyraPagesesID = @menyraPagesesID
      `;

      await connection.request().input('menyraPagesesID', sql.Int, data.menyraPagesesID).query(deleteFromBalanci);
      await connection.request().input('menyraPagesesID', sql.Int, data.menyraPagesesID).query(deleteFromMenyraPagesave);
      
      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Menyra Pageses',
        pershkrimi: `U fshi menyra pageses: ${data.emertimi}, me balanc: ${data.shuma}`,
        nderrimiID: data.nderrimiID
      })
      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('deletePerdoruesi', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      const deletePerdoruesi = `
        DELETE FROM Perdoruesi 
        WHERE perdoruesiID = @perdoruesiID
      `;

      await connection.request().input('perdoruesiID', sql.Int, data.perdoruesiID).query(deletePerdoruesi);
      
      await insertLogs({
        perdoruesiID: data.perdoruesiAktualID,
        komponenta: 'Perdoruesit',
        pershkrimi: `U fshi perdoruesi: ${data.emri}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('deleteServisi', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      // Hapi 1: i marrim produktet e shitura nga tabela servisProdukti ne baze te servisimiID 

      const getServisProdukti = `
      SELECT sp.produktiID,sp.sasia,p.sasiStatike
      from servisProdukti sp
	    join produkti p on p.produktiID = sp.produktiID
      WHERE servisimiID = @servisimiID
    `;
     
    const servisProduktiResult = await connection.request()
        .input('servisimiID', sql.Int, data.idPerAnulim)
        .query(getServisProdukti);

      const soldProducts = servisProduktiResult.recordset;

      // Hapi 2: e perditsojme sasine e produkteve

      const updateProduktiQuery = `
        UPDATE produkti
        SET sasia = sasia + @sasia
        WHERE produktiID = @produktiID
      `;

      for (const produkt of soldProducts) {
       if(!produkt.sasiStatike){
        await connection.request()
        .input('produktiID', sql.Int, produkt.produktiID)
        .input('sasia', sql.Int, produkt.sasia)
        .query(updateProduktiQuery);
       }
      }

      const deleteFromTransaksioni = `
        Delete from transaksioni
        where transaksioniID = @transaksioniID
      ` 
      const deleteFromServisProdukti = `
      DELETE FROM servisProdukti 
      WHERE servisimiID = @servisimiID
    `;

      const deleteFromServisimi = `
        DELETE FROM servisimi 
        WHERE servisimiID = @servisimiID
      `;

      const deletePagesaQuery = `
        delete from pagesa 
        where shifra = @shifra
      `

      const deleteFromProfiti = `
      delete from profiti 
      where transaksioniID = @transaksioniID
    `

     //ktu e marrim shifren e servisit qe dojm me anulu
     const getShifraServisit = ` 
     Select shifra
     from servisimi
     where servisimiID = @servisimiID
   `
   const shifraServisitResult = await connection.request()
        .input('servisimiID', sql.Int, data.idPerAnulim)
        .query(getShifraServisit);

   const shifraServisit = shifraServisitResult.recordset[0]
      console.log('shifra Servisit',shifraServisit)
      let nderrimiID = await getNderrimiID(data.transaksioniID,connection)

      if(data.statusi == 'Perfunduar'){      
        await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteFromProfiti);
        await connection.request().input('shifra', sql.VarChar, shifraServisit.shifra).query(deletePagesaQuery);
        await connection.request().input('servisimiID', sql.Int, data.idPerAnulim).query(deleteFromServisProdukti);
        await connection.request().input('servisimiID', sql.Int, data.idPerAnulim).query(deleteFromServisimi);
        await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteFromTransaksioni);
        await ndryshoBalancin(data.menyraPagesesID,data.totaliPageses,'-',connection,data.perdoruesiID,data.nderrimiID)
        await ndryshoGjendjenEArkes(data.menyraPagesesID,data.totaliPageses,'-',nderrimiID,connection,data.perdoruesiID)

      }else{
        await connection.request().input('servisimiID', sql.Int, data.idPerAnulim).query(deleteFromServisimi);
      }
      
      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Servisimi',
        pershkrimi: `U fshi Servisi: ${shifraServisit.shifra}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('ndryshoSubjektin', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      const updateSubjektiQuery = `
        Update subjekti 
        SET emertimi = @emertimi,
            kontakti = @kontakti
        where subjektiID = @subjektiID
      `;

      await connection.request()
      .input('emertimi', sql.VarChar, data.emertimi)
      .input('kontakti', sql.Int, data.kontakti)
      .input('subjektiID', sql.Int, data.subjektiID)
      .query(updateSubjektiQuery);   

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Subjekti',
        pershkrimi: `U ndryshua subjekti: ${data.emertimi}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('ndryshoOpsionPagese', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      const updateBalanci = `
        Update balanci 
        SET shuma = @shuma
        where menyraPagesesID = @menyraPagesesID
      `;

      await connection.request()
      .input('shuma', sql.Decimal(18,2), data.shuma)
      .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
      .query(updateBalanci);   

      const updateMenyra = `
      Update menyraPageses 
      SET emertimi = @emertimi
      where menyraPagesesID = @menyraPagesesID
      `;

      await connection.request()
      .input('emertimi', sql.VarChar, data.emertimi)
      .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
      .query(updateMenyra);   

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Menyra Pageses',
        pershkrimi: `U ndryshua menyra pageses: ${data.emertimi}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('ndryshoPerdorues', async (event, data) => {
  let connection;

  const { success, hash, salt, error } = await hashData(data.fjalekalimi);

    if (!success) {
      return { success: false, error: error };
    }

  try {
    connection = await sql.connect(config);

      const update = `
        Update Perdoruesi 
        SET emri = @emri,
            fjalekalimiHash = @hash,
            salt = @salt,
            roli = @roli
        where perdoruesiID = @perdoruesiID
      `;

      await connection.request()
      .input('emri', sql.VarChar, data.emri)
      .input('hash', sql.VarChar, hash)
      .input('salt', sql.VarChar, salt)
      .input('roli', sql.VarChar, data.roli)
      .input('perdoruesiID', sql.Int, data.perdoruesiID)
      .query(update);   

    await insertLogs({
      perdoruesiID: data.perdoruesiAktualID,
      komponenta: 'Perdoruesi',
      pershkrimi: `U ndryshua perdoruesi: ${data.emri}`,
      nderrimiID: data.nderrimiID
    })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});



ipcMain.handle('ndryshoServisin', async (event, data) => {
  let connection;
  let dataDheOra
  try {
    dataDheOra = await getDateTime();
    connection = await sql.connect(config);

    if(data.updateType == 'perfundo'){

      const dataPerTransaksion = ({
        ...data,
        dataDheOra,
        lloji:'Servisim',
        eshtePublik:1
      })
  
      const transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)

      await updateLlojiIDTransaksion(data.servisimiID,transaksioniID,connection)

      const updateServisinQuery = `
        Update servisimi 
        SET totaliPerPagese = @totaliPerPagese,
            totaliPageses = @totaliPageses,
            mbetjaPageses = @mbetjaPerPagese,
            statusi = @statusi,
            dataPerfundimit = @dataPerfundimit,
            transaksioniID = @transaksioniID,
            menyraPagesesID = @menyraPagesesID
        where shifra = @shifra
      `;

      await connection.request()
      .input('totaliPerPagese', sql.Decimal(10,2), data.totaliPerPagese)
      .input('totaliPageses', sql.Decimal(10,2), data.totaliIPageses)
      .input('mbetjaPerPagese', sql.Decimal(10,2), data.mbetjaPerPagese)
      .input('statusi', sql.VarChar, 'Perfunduar')
      .input('dataPerfundimit', sql.DateTime, dataDheOra)
      .input('transaksioniID', sql.Int, transaksioniID)
      .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
      .input('shifra', sql.VarChar, data.shifra)
      .query(updateServisinQuery);
      
      let profitiServisit = 0;
      let profitiPerBonuse = 0
      for (const produkt of data.products) {
        let vleraTotaleProduktit = produkt.cmimiPerCope * produkt.sasiaShitjes

        const insertServisProduktiQuery = `
        INSERT INTO servisProdukti (
          servisimiID, produktiID, sasia, cmimiShitjesPerCope, totaliProduktit, komenti, profitiProduktit
        ) VALUES (
          @servisimiID, @produktiID, @sasia, @cmimiShitjesPerCope, @totaliProduktit, @komenti, @profitiProduktit
        )
        `;
            await connection.request()
          .input('servisimiID', sql.Int, data.servisimiID)
          .input('produktiID', sql.Int, produkt.produktiID)
          .input('sasia', sql.Int, produkt.sasiaShitjes)
          .input('cmimiShitjesPerCope', sql.Decimal(18, 2), produkt.cmimiPerCope)
          .input('totaliProduktit', sql.Decimal(18, 2), vleraTotaleProduktit)
          .input('komenti', sql.VarChar, produkt.komenti)
          .input('profitiProduktit', sql.Decimal(18, 2), produkt.profiti)
          .query(insertServisProduktiQuery);

          if(produkt.meFatureTeRregullt == 'po'){
            let tvshHyrese = (produkt.cmimiBlerjes * produkt.sasiaShitjes) * produkt.tvsh / 100
            let tvshDalese = vleraTotaleProduktit * produkt.tvsh / 100
            let tvsh = tvshDalese - tvshHyrese
            profitiPerBonuse = (produkt.profiti - tvsh) + profitiPerBonuse
            profitiServisit = produkt.profiti + profitiServisit
            console.log('produkt me fature ',produkt,profitiPerBonuse,profitiServisit,tvshHyrese,tvshDalese,tvsh)
          }else if(produkt.meFatureTeRregullt == 'jo'){
            profitiServisit = produkt.profiti + profitiServisit
            profitiPerBonuse = produkt.profiti + profitiPerBonuse
            console.log('produkt pa fature ',produkt,profitiPerBonuse,profitiServisit)
          }

        // Update the 'sasia' in 'produkti' table
       if(!produkt.sasiStatike){
          const updateProduktiQuery = `
          UPDATE produkti
          SET sasia = sasia - @sasia
          WHERE produktiID = @produktiID
        `;

        await connection.request()
          .input('produktiID', sql.Int, produkt.produktiID)
          .input('sasia', sql.Int, produkt.sasiaShitjes)
          .query(updateProduktiQuery);
       }

       
    }
 
      const dataPerPagesa = {
        totaliPageses:data.totaliIPageses,
        dataDheOra,
        shifra: data.shifra,
        transaksioniID,
        subjektiID:data.subjektiID,
        menyraPagesesID:data.menyraPagesesID,
        perdoruesiID:data.perdoruesiID,
        nderrimiID:data.nderrimiID
      }
      if(data.totaliIPageses != 0){
        await insertPagesa(dataPerPagesa,connection)
      }

      let statusiProfitit

      if(data.totaliPerPagese == data.totaliIPageses){
        statusiProfitit = 0
      }else{
        statusiProfitit = 1
      }
      
      await insertProfiti(data,profitiServisit,profitiPerBonuse,transaksioniID,dataDheOra,statusiProfitit,connection) // kemi error invalid column name

      await ndryshoBalancin(data.menyraPagesesID,data.totaliIPageses,'+',connection,data.perdoruesiID,data.nderrimiID)
      await ndryshoGjendjenEArkes(data.menyraPagesesID,data.totaliIPageses,'+',data.nderrimiID,connection,data.perdoruesiID)


      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Servisimi',
        pershkrimi: `U ndryshua Servisi: ${data.shifra}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

    }else{
        const updateServisinQuery = `
        Update servisimi 
        SET komenti = @komenti,
            pajisjetPercjellese = @pajisjetPercjellese,
            shifraGarancionit = @shifraGarancionit
        where shifra = @shifra
      `;

      await connection.request()
      .input('komenti', sql.VarChar, data.komenti)
      .input('pajisjetPercjellese', sql.VarChar, data.pajisjetPercjellese)
      .input('shifraGarancionit', sql.VarChar, data.shifraGarancionit)
      .input('shifra', sql.VarChar, data.shifra)
      .query(updateServisinQuery);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Servisimi',
        pershkrimi: `U ndryshua Servisi: ${data.shifra}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };
    }
      

      

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});



ipcMain.handle('ndryshoShitje', async (event, data) => {
  let connection;
  let dataDheOra

  let transaksioniID = null

  try {
    dataDheOra = await getDateTime(); 

    connection = await sql.connect(config);
    let pershkrimi
    const newTpp = data.totaliPerPagese
    const oldTpp = data.totaliPerPageseFillestare
    const newTp = data.totaliPageses
    const oldTp = data.totaliPagesesFillestare
    let logjikaPerPagese 
            // Rasti 1 , pagesa nuk ndryshon
            console.log(newTpp,oldTpp,newTp,oldTp)
        if (newTpp !== oldTpp && newTp === oldTp) {
          pershkrimi = "Totali për Pagesë është ndryshuar, pa ndikuar në Totalin e Paguar. Ka mundësi që janë shtuar ose hequr produkte.";
          logjikaPerPagese = 'nukNdryshon'
        }

        // Rasti 2 
        else if (newTpp !== oldTpp && newTp !== oldTp) {
          if (newTp > oldTp) { //  shtohet nje pagese e re
            pershkrimi = "Totali për Pagesë është ndryshuar, dhe Totali i Paguar është rritur. Mundësi për produkte të shtuara dhe pagesë të shtuar.";
            logjikaPerPagese = 'shtohet+'

          } else { // shtohet nje pagese e re me minus
            pershkrimi = "Totali për Pagesë është ndryshuar, dhe Totali i Paguar është zvogëluar. Mundësi për produkte të hequra dhe pagesë të reduktuar.";
            logjikaPerPagese = 'shtohet-'

          }
        }

        // Rasti 3
        else if (newTpp === oldTpp && newTp !== oldTp) {
          if (newTp > oldTp) { // pagesa shtohet
            pershkrimi = "Totali i Paguar është rritur, ndërsa Totali për Pagesë ka mbetur i pandryshuar. Pagesë shtesë është bërë.";
            logjikaPerPagese = 'shtohet+'

          } else { // pagesa shtohet me minus
            pershkrimi = "Totali i Paguar është zvogëluar, ndërsa Totali për Pagesë ka mbetur i pandryshuar. Reduktim ose korrigjim i shumës së paguar.";
            logjikaPerPagese = 'shtohet-'
          }
        }

        // Rasti 5
        else {
          pershkrimi = "Shitja është ndryshuar për arsye të tjera. Kontrollo detajet.";
          logjikaPerPagese = 'nukNdryshon'
        }

        const dataPerTransaksion = ({
          ...data,
          totaliIPageses:data.totaliPageses,
          dataDheOra,
          pershkrimi,
          lloji:'Modifikim Shitje',
          eshtePublik:1,
          mbetjaPerPagese:data.totaliPerPagese - data.totaliPageses,
        })
    
         transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)

         await updateLlojiIDTransaksion(data.shitjeID,transaksioniID,connection)

         const updateShitjeQuery = `
              UPDATE shitje
              SET 
                  lloji = @lloji,
                  komenti = @komenti,
                  totaliPerPagese = @totaliPerPagese,
                  totaliPageses = @totaliPageses,
                  mbetjaPerPagese = @mbetjaPerPagese,
                  dataShitjes = @dataShitjes,
                  menyraPagesesID = @menyraPagesesID,
                  subjektiID = @subjektiID,
                  kohaGarancionit = @kohaGarancionit
              OUTPUT INSERTED.shitjeID
              WHERE shitjeID = @shitjeID
          `;
      

    const shitjeResult = await connection.request()
      .input('lloji', sql.VarChar, data.lloji)
      .input('komenti', sql.VarChar, data.komenti)
      .input('totaliPerPagese', sql.Decimal(18, 2), data.totaliPerPagese)
      .input('totaliPageses', sql.Decimal(18, 2), data.totaliPageses)
      .input('mbetjaPerPagese', sql.Decimal(18, 2), data.mbetjaPerPagese)
      .input('dataShitjes', sql.DateTime, data.dataShitjes)
      .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
      .input('subjektiID', sql.Int, data.subjektiID)
      .input('kohaGarancionit', sql.Int, data.kohaGarancionit)
      .input('shitjeID', sql.Int, data.shitjeID)
      .query(updateShitjeQuery);

      const shitjeID = shitjeResult.recordset[0].shitjeID;

      let profitiShitjes = 0
      let profitiPerBonuse = 0
      await anuloShitjeProdukti(data);
      console.log('data per ndryshim shitje',data)

      for (const produkt of data.produktet) {

          console.log('nje produkt te ndryshim shitje,', produkt)
          const insertShitjeProduktiQuery = `
          INSERT INTO shitjeProdukti (
            shitjeID, produktiID, sasia, cmimiShitjesPerCope, totaliProduktit, komenti, profitiProduktit
          ) VALUES (
            @shitjeID, @produktiID, @sasia, @cmimiShitjesPerCope, @totaliProduktit, @komenti, @profitiProduktit
          )
          `;
              await connection.request()
            .input('shitjeID', sql.Int, shitjeID)
            .input('produktiID', sql.Int, produkt.produktiID)
            .input('sasia', sql.Int, produkt.sasiaShitjes)
            .input('cmimiShitjesPerCope', sql.Decimal(18, 2), produkt.cmimiPerCope)
            .input('totaliProduktit', sql.Decimal(18, 2), produkt.cmimiPerCope * produkt.sasiaShitjes)
            .input('komenti', sql.VarChar, produkt.komenti)
            .input('profitiProduktit', sql.Decimal(18, 2), produkt.profiti)
            .query(insertShitjeProduktiQuery);

             if(produkt.meFatureTeRregullt == 'po'){
            
                let tvshHyrese = (produkt.cmimiBlerjes * produkt.sasiaShitjes) * produkt.tvsh / 100
                let tvshDalese = produkt.vleraTotaleProduktit * produkt.tvsh / 100
                let tvsh = tvshDalese - tvshHyrese
                profitiPerBonuse = (produkt.profiti - tvsh) + profitiPerBonuse
                profitiShitjes = produkt.profiti + profitiShitjes
                console.log('produkt me fature',produkt,profitiPerBonuse,profitiShitjes,tvsh)

              }else if(produkt.meFatureTeRregullt == 'jo'){

                profitiShitjes = produkt.profiti + profitiShitjes
                profitiPerBonuse = Number(produkt.profiti) + profitiPerBonuse
                console.log('produkt pa fature',produkt,profitiPerBonuse,profitiShitjes)

              }

          // Update the 'sasia' in 'produkti' table
         if(!produkt.sasiStatike){
            const updateProduktiQuery = `
            UPDATE produkti
            SET sasia = sasia - @sasia
            WHERE produktiID = @produktiID
          `;

          await connection.request()
            .input('produktiID', sql.Int, produkt.produktiID)
            .input('sasia', sql.Int, produkt.sasiaShitjes)
            .query(updateProduktiQuery);
         }
        }

      let statusi;
      if (data.mbetjaPerPagese <= 0) {
        statusi =  0;
      } else {
        statusi =  1;
      }

      const updateProfitiShitjes = `
      UPDATE profiti
      SET 
        shuma = @shuma,
        statusi = @statusi,
        dataProfitit = @dataProfitit,
        shumaPerBonuse = @shumaPerBonuse
      WHERE 
        transaksioniID = @transaksioniID
    `;

    await connection.request()
      .input('shuma', sql.Decimal(18, 2), profitiShitjes) 
      .input('transaksioniID', sql.Int, data.transaksioniIDFillestar) 
      .input('dataProfitit', sql.DateTime, dataDheOra) 
      .input('statusi', sql.Int, statusi) 
      .input('shumaPerBonuse', sql.Decimal(18, 2), profitiPerBonuse) 
      .query(updateProfitiShitjes);

      const tp = newTp - oldTp // sa € osht shtu ose minusu pagesa 
     
      if((logjikaPerPagese == 'shtohet+' || logjikaPerPagese == 'shtohet-') || (data.menyraPagesesID != data.menyraPagesesIDFillestare)){

        if(data.menyraPagesesID != data.menyraPagesesIDFillestare){

            await ndryshoBalancin(data.menyraPagesesIDFillestare,data.totaliPagesesFillestare,'-',connection,data.perdoruesiID,data.nderrimiID)
            await ndryshoBalancin(data.menyraPagesesID,data.totaliPageses,'+',connection,data.perdoruesiID,data.nderrimiID)
    
        }else{
              await ndryshoBalancin(data.menyraPagesesID,tp,'+',connection,data.perdoruesiID,data.nderrimiID)
          } 

      }    
      
      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Shitje',
        pershkrimi: `U ndryshua shitja: ${data.shifra}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true,shifra:data.shifra,shitjeID:shitjeID };
    } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('ndryshoShitjenAprovuarOnline', async (event, data) => {
  let connection;
  let dataDheOra

  let transaksioniID = null
  try {
    dataDheOra = await getDateTime(); 

    connection = await sql.connect(config);
    let pershkrimi
    const newTotaliPerPagese = data.totaliPerPagese
    const oldTotaliPerPagese = data.totaliPerPageseFillestare
    const newKostoPostes = data.kostoPostes
    const oldKostoPostes = data.oldKostoPostes
    let logjikaPerPagese 
    console.log(newTotaliPerPagese,oldTotaliPerPagese,newKostoPostes,oldKostoPostes)
            // Rasti 1 , pagesa nuk ndryshon
        if (newTotaliPerPagese !== oldTotaliPerPagese && newKostoPostes === oldKostoPostes) {
          pershkrimi = `Totali për Pagesë është ndryshuar, pa ndikuar ne Kosto te Postes ${oldKostoPostes}. Ka mundësi që janë shtuar ose hequr produkte.`;
          logjikaPerPagese = 'nukNdryshon'
        }else if(newKostoPostes > oldKostoPostes) { 
            pershkrimi = `Kosto e Postes eshte Rritur:${newKostoPostes}, Produktet nuk jane Ndryshuar.`;
            logjikaPerPagese = 'shtohet+'

        } else if(newKostoPostes < oldKostoPostes) { 
            pershkrimi = `Kosto e Postes eshte Zvogluar:${newKostoPostes}, Produktet nuk jane Ndryshuar.`;
            logjikaPerPagese = 'shtohet-'

        }
        else {
          pershkrimi = "Shitja është ndryshuar për arsye të tjera. Kontrollo detajet.";
          logjikaPerPagese = 'nukNdryshon'
        }

        const dataPerTransaksion = ({
          ...data,
          totaliIPageses:data.totaliPageses,
          dataDheOra,
          pershkrimi,
          lloji:'Modifikim Shitje Online',
          eshtePublik:1,
          mbetjaPerPagese:0,
        })
    
         transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)

         await updateLlojiIDTransaksion(data.shitjeID,transaksioniID,connection)

         const updateShitjeQuery = `
              UPDATE shitje
              SET 
                  lloji = @lloji,
                  komenti = @komenti,
                  totaliPerPagese = @totaliPerPagese,
                  totaliPageses = @totaliPageses,
                  mbetjaPerPagese = @mbetjaPerPagese,
                  dataShitjes = @dataShitjes,
                  menyraPagesesID = @menyraPagesesID,
                  subjektiID = @subjektiID,
                  kohaGarancionit = @kohaGarancionit
              OUTPUT INSERTED.shitjeID
              WHERE shitjeID = @shitjeID
          `;
      

    const shitjeResult = await connection.request()
      .input('lloji', sql.VarChar, data.lloji)
      .input('komenti', sql.VarChar, data.komenti)
      .input('totaliPerPagese', sql.Decimal(18, 2), data.totaliPerPagese)
      .input('totaliPageses', sql.Decimal(18, 2), data.totaliPageses)
      .input('mbetjaPerPagese', sql.Decimal(18, 2), 0)
      .input('dataShitjes', sql.DateTime, data.dataShitjes)
      .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
      .input('subjektiID', sql.Int, data.subjektiID)
      .input('kohaGarancionit', sql.Int, data.kohaGarancionit)
      .input('shitjeID', sql.Int, data.shitjeID)
      .query(updateShitjeQuery);

      const shitjeID = shitjeResult.recordset[0].shitjeID;

      let profitiShitjes = 0
      let profitiPerBonuse = 0
      await anuloShitjeProdukti(data);
      console.log('data per ndryshim shitje',data)

      for (const produkt of data.produktet) {

          console.log('nje produkt te ndryshim shitje,', produkt)
          const insertShitjeProduktiQuery = `
          INSERT INTO shitjeProdukti (
            shitjeID, produktiID, sasia, cmimiShitjesPerCope, totaliProduktit, komenti, profitiProduktit
          ) VALUES (
            @shitjeID, @produktiID, @sasia, @cmimiShitjesPerCope, @totaliProduktit, @komenti, @profitiProduktit
          )
          `;
              await connection.request()
            .input('shitjeID', sql.Int, shitjeID)
            .input('produktiID', sql.Int, produkt.produktiID)
            .input('sasia', sql.Int, produkt.sasiaShitjes)
            .input('cmimiShitjesPerCope', sql.Decimal(18, 2), produkt.cmimiPerCope)
            .input('totaliProduktit', sql.Decimal(18, 2), produkt.cmimiPerCope * produkt.sasiaShitjes)
            .input('komenti', sql.VarChar, produkt.komenti)
            .input('profitiProduktit', sql.Decimal(18, 2), produkt.profiti)
            .query(insertShitjeProduktiQuery);

            if(produkt.meFatureTeRregullt == 'po'){

              let tvshHyrese = (produkt.cmimiBlerjes * produkt.sasiaShitjes) * produkt.tvsh / 100
              let tvshDalese = produkt.vleraTotaleProduktit * produkt.tvsh / 100
              let tvsh = tvshDalese - tvshHyrese
              profitiPerBonuse = (produkt.profiti - tvsh) + profitiPerBonuse
              profitiShitjes = produkt.profiti + profitiShitjes
              console.log('produkt me fature',produkt,profitiPerBonuse,profitiShitjes,tvsh)

            }else if(produkt.meFatureTeRregullt == 'jo'){

              profitiShitjes = produkt.profiti + profitiShitjes
              profitiPerBonuse = produkt.profiti + profitiPerBonuse
              console.log('produkt pa fature',produkt,profitiPerBonuse,profitiShitjes)

            }

          // Update the 'sasia' in 'produkti' table
         if(!produkt.sasiStatike){
            const updateProduktiQuery = `
            UPDATE produkti
            SET sasia = sasia - @sasia
            WHERE produktiID = @produktiID
          `;

          await connection.request()
            .input('produktiID', sql.Int, produkt.produktiID)
            .input('sasia', sql.Int, produkt.sasiaShitjes)
            .query(updateProduktiQuery);
         }
        }

      let statusi;
      if (data.mbetjaPerPagese <= 0) {
        statusi =  0;
      } else {
        statusi =  1;
      }

      const updateProfitiShitjes = `
      UPDATE profiti
      SET 
        shuma = @shuma,
        statusi = @statusi,
        dataProfitit = @dataProfitit,
        shumaPerBonuse = @shumaPerBonuse
      WHERE 
        transaksioniID = @transaksioniID
    `;

    await connection.request()
      .input('shuma', sql.Decimal(18, 2), profitiShitjes - data.kostoPostes) 
      .input('shumaPerBonuse', sql.Decimal(18, 2), profitiPerBonuse - data.kostoPostes) 
      .input('transaksioniID', sql.Int, data.transaksioniIDFillestar) 
      .input('dataProfitit', sql.DateTime, dataDheOra) 
      .input('statusi', sql.Int, statusi) 
      .query(updateProfitiShitjes);

      

      if(data.lloji =='online'){
        console.log('brenda shitjes online')

        const updateShitjeOnline = `
        UPDATE shitjeOnline
        SET 
          kostoPostes = @kostoPostes,
          totaliIPranimit = @totaliIPranimit
        WHERE 
          shitjeID = @shitjeID
      `;
  
      await connection.request()
        .input('kostoPostes', sql.Decimal(18, 2), data.kostoPostes) 
        .input('totaliIPranimit', sql.Decimal(18, 2), data.totaliPranuar) 
        .input('shitjeID', sql.Int, data.shitjeID) 
        .query(updateShitjeOnline);
  
      }
     
      if((logjikaPerPagese == 'shtohet+' || logjikaPerPagese == 'shtohet-') || (data.menyraPagesesID != data.menyraPagesesIDFillestare)){

        if(data.menyraPagesesID != data.menyraPagesesIDFillestare){

            await ndryshoBalancin(data.menyraPagesesIDFillestare,data.totaliPagesesFillestare,'-',connection,data.perdoruesiID,data.nderrimiID)
            await ndryshoBalancin(data.menyraPagesesID,data.totaliPageses,'+',connection,data.perdoruesiID,data.nderrimiID)
    
        }else{
              await ndryshoBalancin(data.menyraPagesesID,data.totaliIPranuar,'+',connection,data.perdoruesiID,data.nderrimiID)
          } 

      }
      
      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Shitje Online',
        pershkrimi: `U ndryshua shitja e aprovuar online: ${data.shifra}`,
        nderrimiID: data.nderrimiID
      })
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('ndryshoBlerje', async (event, data) => {
  let connection;
  let dataDheOra

  let transaksioniID = null

  try {
    dataDheOra = await getDateTime(); 

    connection = await sql.connect(config);
    let pershkrimi
    const newTpp = data.totaliPerPagese
    const oldTpp = data.totaliPerPageseFillestare
    const newTp = data.totaliPageses
    const oldTp = data.totaliPagesesFillestare
    let logjikaPerPagese 

            // Rasti 1 , pagesa nuk ndryshon
            console.log(newTpp,oldTpp,newTp,oldTp)
        if (newTpp !== oldTpp) {
          pershkrimi = "Totali për Pagesë është ndryshuar, pa ndikuar në Totalin e Paguar. Ka mundësi që janë shtuar ose hequr produkte.";
          logjikaPerPagese = 'nukNdryshon'
        }
        // Rasti 5
        else {
          pershkrimi = "Blerja është ndryshuar për arsye të tjera. Kontrollo detajet.";
          logjikaPerPagese = 'nukNdryshon'
        }

        const dataPerTransaksion = ({
          ...data,
          totaliIPageses:data.totaliPageses,
          dataDheOra,
          pershkrimi,
          lloji:'Modifikim Blerje',
          eshtePublik:0
        })
    
        transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)

        await updateLlojiIDTransaksion(data.blerjeID,transaksioniID,connection)

      const updateBlerjeQuery = `
          UPDATE blerje
          SET 
              komenti = @komenti,
              totaliPerPagese = @totaliPerPagese,
              totaliPageses = @totaliPageses,
              mbetjaPerPagese = @mbetjaPerPagese,
              dataBlerjes = @dataBlerjes,
              dataFatures = @dataFatures,
              fatureERregullt = @fatureERregullt,
              nrFatures = @nrFatures,
              subjektiID = @subjektiID

              WHERE blerjeID = @blerjeID
      `;
      

    const blerjeResult = await connection.request()
      .input('komenti', sql.VarChar, data.komentiBlerjes)
      .input('totaliPerPagese', sql.Decimal(18, 2), data.totaliPerPagese)
      .input('totaliPageses', sql.Decimal(18, 2), data.totaliPageses)
      .input('mbetjaPerPagese', sql.Decimal(18, 2), data.mbetjaPerPagese)
      .input('dataBlerjes', sql.DateTime, data.dataBlerjes)
      .input('dataFatures', sql.Date, data.dataFatures)
      .input('fatureERregullt', sql.Bit, data.fatureERregullt)
      .input('nrFatures', sql.VarChar, data.nrFatures)
      .input('subjektiID', sql.Int, data.subjektiID)
      .input('blerjeID', sql.Int, data.blerjeID)
      .query(updateBlerjeQuery);


     

      await anuloBlerjeProdukti(data);
      

      for (const produkt of data.products) {
        
          const insertBlerjeProduktiQuery = `
          INSERT INTO blerjeProdukt (
            blerjeID, produktiID, sasia, cmimiPerCope, totaliProduktit, komenti, totaliTvsh
          ) VALUES (
            @blerjeID, @produktiID, @sasia, @cmimiPerCope, @totaliProduktit, @komenti, @totaliTvsh
          )
          `;
              await connection.request()
            .input('blerjeID', sql.Int, data.blerjeID)
            .input('produktiID', sql.Int, produkt.produktiID)
            .input('sasia', sql.Int, produkt.sasiaBlerese)
            .input('cmimiPerCope', sql.Decimal(18, 2), produkt.cmimiBlerjes)
            .input('totaliProduktit', sql.Decimal(18, 2), produkt.cmimiBlerjes * produkt.sasiaShitjes)
            .input('komenti', sql.VarChar, produkt.komenti)
            .input('totaliTvsh', sql.Decimal(18, 2), produkt.totaliTvsh)
            .query(insertBlerjeProduktiQuery);


          const updateProduktiQuery = `
            UPDATE produkti
            SET sasia = sasia + @sasia
            WHERE produktiID = @produktiID
          `;

          await connection.request()
            .input('produktiID', sql.Int, produkt.produktiID)
            .input('sasia', sql.Int, produkt.sasiaBlerese)
            .query(updateProduktiQuery);
      }
        insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Blerje',
        pershkrimi: `U ndryshua blerja: ${data.shifra}`,
        nderrimiID: data.nderrimiID
      })

    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});


ipcMain.handle('ndryshoServisinPerfunduar', async (event, data) => {
  let connection;
  let dataDheOra

  let transaksioniID = null

  try {
    dataDheOra = await getDateTime(); 

    connection = await sql.connect(config);
    let pershkrimi
    const newTpp = data.totaliPerPagese
    const oldTpp = data.totaliPerPageseFillestare
    const newTp = data.totaliIPageses
    const oldTp = data.totaliPagesesFillestare
    let logjikaPerPagese 
            // Rasti 1 , pagesa nuk ndryshon
            console.log(newTpp,oldTpp,newTp,oldTp)
        if (newTpp !== oldTpp && newTp === oldTp) {
          pershkrimi = "Totali për Pagesë është ndryshuar, pa ndikuar në Totalin e Paguar. Ka mundësi që janë shtuar ose hequr produkte.";
          logjikaPerPagese = 'nukNdryshon'
        }

        // Rasti 2 
        else if (newTpp !== oldTpp && newTp !== oldTp) {
          if (newTp > oldTp) { //  shtohet nje pagese e re
            pershkrimi = "Totali për Pagesë është ndryshuar, dhe Totali i Paguar është rritur. Mundësi për produkte të shtuara dhe pagesë të shtuar.";
            logjikaPerPagese = 'shtohet+'

          } else { // shtohet nje pagese e re me minus
            pershkrimi = "Totali për Pagesë është ndryshuar, dhe Totali i Paguar është zvogëluar. Mundësi për produkte të hequra dhe pagesë të reduktuar.";
            logjikaPerPagese = 'shtohet-'

          }
        }

        // Rasti 3
        else if (newTpp === oldTpp && newTp !== oldTp) {
          if (newTp > oldTp) { // pagesa shtohet
            pershkrimi = "Totali i Paguar është rritur, ndërsa Totali për Pagesë ka mbetur i pandryshuar. Pagesë shtesë është bërë.";
            logjikaPerPagese = 'shtohet+'

          } else { // pagesa shtohet me minus
            pershkrimi = "Totali i Paguar është zvogëluar, ndërsa Totali për Pagesë ka mbetur i pandryshuar. Reduktim ose korrigjim i shumës së paguar.";
            logjikaPerPagese = 'shtohet-'
          }
        }

        // Rasti 5
        else {
          pershkrimi = "Servisi është ndryshuar për arsye të tjera. Kontrollo detajet.";
          logjikaPerPagese = 'nukNdryshon'
        }

        const dataPerTransaksion = ({
          ...data,
          dataDheOra,
          pershkrimi,
          lloji:'Modifikim Servisi',
          eshtePublik:1
        })
    
        transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)

        await updateLlojiIDTransaksion(data.servisimiID,transaksioniID,connection)

      const updateServisimiQuery = `
          UPDATE servisimi
          SET 
              komenti = @komenti,
              totaliPerPagese = @totaliPerPagese,
              totaliPageses = @totaliPageses,
              mbetjaPageses = @mbetjaPageses,
              transaksioniID = @transaksioniID,
              menyraPagesesID = @menyraPagesesID
          WHERE servisimiID = @servisimiID
      `;
      

     await connection.request()
      .input('komenti', sql.VarChar, data.komenti)
      .input('totaliPerPagese', sql.Decimal(18, 2), data.totaliPerPagese)
      .input('totaliPageses', sql.Decimal(18, 2), data.totaliIPageses)
      .input('mbetjaPageses', sql.Decimal(18, 2), data.mbetjaPerPagese)
      .input('transaksioniID', sql.Int, transaksioniID)
      .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
      .input('servisimiID', sql.Int, data.servisimiID)
      .query(updateServisimiQuery);

      let profitiServisit = 0;
      let profitiShitjes = 0

      await anuloServisProdukti(data);

      for (const produkt of data.produktet) {
        
          const insertServisProduktiQuery = `
          INSERT INTO servisProdukti (
            servisimiID, produktiID, sasia, cmimiShitjesPerCope, totaliProduktit, komenti, profitiProduktit
          ) VALUES (
            @servisimiID, @produktiID, @sasia, @cmimiShitjesPerCope, @totaliProduktit, @komenti, @profitiProduktit
          )
          `;
              await connection.request()
            .input('servisimiID', sql.Int, data.servisimiID)
            .input('produktiID', sql.Int, produkt.produktiID)
            .input('sasia', sql.Int, produkt.sasiaShitjes)
            .input('cmimiShitjesPerCope', sql.Decimal(18, 2), produkt.cmimiPerCope)
            .input('totaliProduktit', sql.Decimal(18, 2), produkt.cmimiPerCope * produkt.sasiaShitjes)
            .input('komenti', sql.VarChar, produkt.komenti)
            .input('profitiProduktit', sql.Decimal(18, 2), produkt.profiti)
            .query(insertServisProduktiQuery);

            profitiShitjes = produkt.profiti + profitiShitjes

          // Update the 'sasia' in 'produkti' table
          const updateProduktiQuery = `
            UPDATE produkti
            SET sasia = sasia - @sasia
            WHERE produktiID = @produktiID
          `;

          if(!produkt.sasiStatike){
            await connection.request()
            .input('produktiID', sql.Int, produkt.produktiID)
            .input('sasia', sql.Int, produkt.sasiaShitjes)
            .query(updateProduktiQuery);
          }

      }

      let statusi;
      if (data.mbetjaPerPagese <= 0) {
        statusi =  0;
      } else {
        statusi =  1;
      }

      const updateProfitiShitjes = `
      UPDATE profiti
      SET 
        shuma = @shuma,
        statusi = @statusi,
        dataProfitit = @dataProfitit
      WHERE 
        transaksioniID = @transaksioniID
    `;

    await connection.request()
      .input('shuma', sql.Decimal(18, 2), profitiShitjes) 
      .input('transaksioniID', sql.Int, data.transaksioniIDFillestar) 
      .input('dataProfitit', sql.DateTime, dataDheOra) 
      .input('statusi', sql.Int, statusi) 
      .query(updateProfitiShitjes);

      const tp = newTp - oldTp // sa € osht shtu ose minusu pagesa 

      if((logjikaPerPagese == 'shtohet+' || logjikaPerPagese == 'shtohet-') || (data.menyraPagesesID != data.menyraPagesesIDFillestare)){

          console.log('menyraPageses:----------',data.menyraPagesesID,data.menyraPagesesIDFillestare)
            if(data.menyraPagesesID != data.menyraPagesesIDFillestare){

              await ndryshoBalancin(data.menyraPagesesIDFillestare,data.totaliPagesesFillestare,'-',connection,data.perdoruesiID,data.nderrimiID)
              await ndryshoBalancin(data.menyraPagesesID,data.totaliIPageses,'+',connection,data.perdoruesiID,data.nderrimiID)
    
            }else{
              await ndryshoBalancin(data.menyraPagesesID,tp,'+',connection,data.perdoruesiID,data.nderrimiID)
            } 
            await ndryshoGjendjenEArkes(data.menyraPagesesID,tp,'+',data.nderrimiID,connection,data.perdoruesiID)

          }

          await insertLogs({
            perdoruesiID: data.perdoruesiID,
            komponenta: 'Servis',
            pershkrimi: `U ndryshua servisi i perfunduar: ${data.shifra}`,
            nderrimiID: data.nderrimiID
          })

      return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('insertLlojiShpenzimit', async (event, data) => {
  let connection;
  try {
    // Connect to the database
    connection = await sql.connect(config);

    const insertLlojiShpenzimit = `
      INSERT INTO llojetShpenzimeve (
        emertimi, shumaStandarde
      ) OUTPUT INSERTED.llojetShpenzimeveID VALUES (
        @emertimi, @shumaStandarde
      )
    `;

    const llojiShpenzimeveResult = await connection.request()
      .input('emertimi', sql.VarChar, data.emertimi)
      .input('shumaStandarde', sql.Decimal(18,2), data.shumaStandarde)
      .query(insertLlojiShpenzimit);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Lloji Shpenzimit',
        pershkrimi: `U shtua lloji i shpenzimit: ${data.emertimi}`,
        nderrimiID: data.nderrimiID
      })
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('shtoPushimin', async (event, data) => {
  let connection;
  try {
    // Connect to the database
    connection = await sql.connect(config);

    const insertPushimi = `
      INSERT INTO pushimet (
        punonjesID,dataFillimit,dataMbarimit,lloji,aprovohet,arsyeja,nrDiteve
      )  VALUES (
        @punonjesID,@dataFillimit,@dataMbarimit,@lloji,@aprovohet,@arsyeja,@nrDiteve
      )
    `;

    await connection.request()
      .input('punonjesID', sql.Int, data.punonjesID)
      .input('dataFillimit', sql.Date, data.dataFillimit)
      .input('dataMbarimit', sql.Date, data.dataMbarimit)
      .input('lloji', sql.VarChar, data.lloji)
      .input('aprovohet', sql.Bit, 1)
      .input('arsyeja', sql.VarChar, data.arsyeja)
      .input('nrDiteve', sql.Int, data.nrDiteve)
      .query(insertPushimi);

    await insertLogs({
      perdoruesiID: data.perdoruesiID,
      komponenta: 'Pushim',
      pershkrimi: `U shtua pushimi: ${data.lloji}`,
      nderrimiID: data.nderrimiID
    })

    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('paguajBonuset', async (event, data) => {
    let connection;
    let dataDheOra
    console.log('data logged',data)
    try {
      dataDheOra = await getDateTime(); 
      connection = await sql.connect(config);

      const dataPerTransaksion1 = ({
        lloji:'Pagese Bonuseve',
        mbetjaPerPagese:0, 
        dataDheOra,
        perdoruesiID:data.perdoruesiID,
        nderrimiID:data.nderrimiID,
        komenti:'',
        pershkrimi:'Pagese e Bonuseve per punonjesin',
        eshtePublik:0
      })
      console.log(dataPerTransaksion1)


      const insert = `
        INSERT INTO bonusetPunonjesit (
          punonjesiID, bonusetID,statusi,menyraPagesesID,dataPageses,transaksioniID,shifra
        )  VALUES (
          @punonjesiID, @bonusetID,@statusi,@menyraPagesesID,@dataPageses,@transaksioniID,@shifra
        )
      `;

      for (const item of data.bonusetPerPunonjes) {

        let shifra = await generateNextShifra('bonusetPunonjesit','BN',connection)

        dataPerTransaksion2 = ({
          ...dataPerTransaksion1,
          shifra,
          totaliPerPagese:item.shuma,
          totaliIPageses:item.shuma,
        })

        const transaksioniID = await insertTransaksionin(dataPerTransaksion2,connection)

        await connection.request()
            .input('punonjesiID', sql.Int, data.punonjesiID)
            .input('bonusetID', sql.Int, item.bonusetID)
            .input('statusi', sql.TinyInt, 1)
            .input('dataPageses', sql.DateTime, dataDheOra)
            .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
            .input('transaksioniID', sql.Int, transaksioniID)
            .input('shifra', sql.VarChar, shifra)
            .query(insert);
    }

      await ndryshoBalancin(data.menyraPagesesID,data.totalBonuset,'-',connection,data.perdoruesiID,data.nderrimiID)
      await ndryshoGjendjenEArkes(data.menyraPagesesID,data.totalBonuset,'-',data.nderrimiID,connection,data.perdoruesiID)

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Bonuset',
        pershkrimi: `U paguan bonuset e punonjesit: ${shifra}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };
    } catch (error) {
      console.error('Database error:', error);
      return { success: false, error: error.message };
    } finally {
        
    }
  });

  const ndryshoBalancin = async (menyraPagesesID, shuma, veprimi, connection,perdoruesiID,nderrimiID) => {
    try {
      const updateBalanci = veprimi === '+' 
        ? `UPDATE balanci SET shuma = shuma + @shuma WHERE menyraPagesesID = @menyraPagesesID`
        : `UPDATE balanci SET shuma = shuma - @shuma WHERE menyraPagesesID = @menyraPagesesID`;
  
      await connection.request()
        .input('shuma', sql.Decimal(10, 2), shuma) 
        .input('menyraPagesesID', sql.Int, menyraPagesesID)
        .query(updateBalanci);
  
      await insertLogs({
        perdoruesiID: perdoruesiID,
        komponenta: 'Balancet',
        pershkrimi: `U ndryshua balanci i menyres se pageses me veprimin: ${veprimi} , shuma:${shuma} ne: ${menyraPagesesID}`,
        nderrimiID: nderrimiID
      })

      return { success: true }; 
    } catch (error) {
      console.error('Database error in ndryshoBalancin:', error); 
      return { success: false, error: error.message };
    }
  };


const insertPagesa = async (data,connection) => {
    try {
        const insertPagesatQuery = `
        insert into pagesa (
          shumaPageses,dataPageses,shifra,transaksioniID,subjektiID,menyraPagesesID
        ) values (
          @shumaPageses,@dataPageses,@shifra,@transaksioniID,@subjektiID,@menyraPagesesID
        )
      `
    
        await connection.request()
          .input('shumaPageses',sql.Decimal(10,2),data.totaliPageses)
          .input('dataPageses',sql.DateTime, data.dataDheOra)
          .input('shifra',sql.VarChar , data.shifra)
          .input('transaksioniID',sql.Int , data.transaksioniID)
          .input('subjektiID',sql.Int, data.subjektiID)
          .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
          .query(insertPagesatQuery)

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Pagesa',
        pershkrimi: `U shtua pagesa per dokumentin: ${data.shifra}, me shumen: ${data.totaliPageses}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true }; 
    } catch (error) {
      console.error('Database error in ndryshoBalancin:', error); 
      return { success: false, error: error.message };
    }
  };

  ipcMain.handle('deletePagesa', async (event, data) => {
    let connection;
    let llojiDokumentit = data.llojiDokumentit
    let llojiDokumentit2 
    const dataDheOra = await getDateTime()
    if(data.llojiDokumentit != null){
      llojiDokumentit2 = llojiDokumentit.charAt(0).toUpperCase() + data.llojiDokumentit.slice(1).toLowerCase()
    }

    try {
      connection = await sql.connect(config);

      const fetchTransaksioniData = `
        SELECT  totaliPerPagese, totaliIPageses, mbetjaPerPagese
        FROM transaksioni
        WHERE transaksioniID = @transaksioniID
      `;

      // Execute the SELECT query
      const fetchedDataResult = await connection.request()
        .input('transaksioniID', sql.Int, data.transaksioniID) 
        .query(fetchTransaksioniData);

      const fetchedData = fetchedDataResult.recordset[0]; 



       const transaksioniQuery = `
          INSERT INTO transaksioni (
            shifra, lloji, pershkrimi,totaliPerPagese, totaliIPageses, mbetjaPerPagese, dataTransaksionit, perdoruesiID, nderrimiID, komenti
          ) OUTPUT INSERTED.transaksioniID VALUES (
            @shifra, @lloji,@pershkrimi, @totaliPerPagese, @totaliIPageses, @mbetjaPerPagese, @dataTransaksionit, @perdoruesiID, @nderrimiID, @komenti
          )
        `;
        console.log('asdsadsadsadasd',data)
        console.log('asdsadsadsadasd2222222',fetchedData)
        const mbetjaPerPagese = fetchedData.mbetjaPerPagese + data.shumaPageses
        const totaliIPageses = fetchedData.totaliPerPagese - mbetjaPerPagese

        console.log('vlerat',totaliIPageses,'/',mbetjaPerPagese)

         await connection.request()
          .input('shifra', sql.VarChar, data.shifra)
          .input('lloji', sql.VarChar, llojiDokumentit2)
          .input('pershkrimi', sql.VarChar, 'Nje Pagese Paraprake eshte Anuluar!.')
          .input('totaliPerPagese', sql.Decimal(18, 2), fetchedData.totaliPerPagese)
          .input('totaliIPageses', sql.Decimal(18, 2), totaliIPageses)
          .input('mbetjaPerPagese', sql.Decimal(18, 2), mbetjaPerPagese)
          .input('dataTransaksionit', sql.DateTime, dataDheOra)
          .input('perdoruesiID', sql.Int, data.perdoruesiID)
          .input('nderrimiID', sql.Int, data.nderrimiID)
          .input('komenti', sql.VarChar, data.komenti)
          .query(transaksioniQuery);
  
      let emertimiMenyresPageses = 'mbetjaPerPagese'

      if(llojiDokumentit == 'servisimi'){ // kjo bohet per shkak se ne databaze tabela servisimi e ka emertimin ndryshe ( gabim sintaksor :( )
        emertimiMenyresPageses = 'mbetjaPageses'
      }

      const updateQuery = `UPDATE ${llojiDokumentit}
      SET  totaliPageses = totaliPageses - @totaliPageses, ${emertimiMenyresPageses} = ${emertimiMenyresPageses} + @mbetjaPerPagese
      where shifra = @shifra`
      const l = await connection.request()
      .input('totaliPageses',sql.Decimal(10,2),data.shumaPageses)
      .input('mbetjaPerPagese',sql.Decimal(10,2),data.shumaPageses)
      .input(`shifra`,sql.VarChar,data.shifra)
      .query(updateQuery)

      const deletePagesaQuery = `DELETE from pagesa where transaksioniID = @transaksioniID`
      await connection.request()
      .input('transaksioniID',sql.Int,data.transaksioniID)
      .query(deletePagesaQuery)

      if(llojiDokumentit == 'shitje' || llojiDokumentit == 'servisimi'){ // pasi qe fshihet pagesa i bjen qe shitja sosht pagu plotesisht edhe e hek llogaritjen e bonuseve!
          let statusi;
        if (mbetjaPerPagese <= 0) {
          statusi =  0;
        } else {
          statusi =  1;
        }

        const updateProfiti = `
        UPDATE profiti
        SET 
          statusi = @statusi,
          dataProfitit = @dataProfitit
        WHERE 
          transaksioniID = @transaksioniID
      `;

      await connection.request()
        .input('transaksioniID', sql.Int, data.transaksioniID) 
        .input('dataProfitit', sql.DateTime, dataDheOra) 
        .input('statusi', sql.Int, statusi) 
        .query(updateProfiti);
      }

      await ndryshoBalancin(data.menyraPagesesID,data.shumaPageses,'-',connection,data.perdoruesiID,data.nderrimiID) //tested ok
      await ndryshoGjendjenEArkes(data.menyraPagesesID,data.shumaPageses,'-',data.nderrimiID,connection,data.perdoruesiID) //tested ok

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Pagesa',
        pershkrimi: `U anulua pagesa per dokumentin: ${data.shifra}, me shumen: ${data.shumaPageses}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };
    } catch (error) {
      console.error('Database error:', error);
      return { success: false, error: error.message };
    } 
  });

  ipcMain.handle('shtoPagese', async (event, data) => {
    let connection;
    let llojiDokumentit = data.llojiDokumentit
    let llojiDokumentit2 
    const dataDheOra = await getDateTime()
    if(llojiDokumentit != null){
      llojiDokumentit2 = llojiDokumentit.charAt(0).toUpperCase() + data.llojiDokumentit.slice(1).toLowerCase()
    }

    try {
      // Connect to the database
      connection = await sql.connect(config);

      const dataPerTransaksion = ({
            ...data,
            pershkrimi:'Totali i Paguar është rritur, ndërsa Totali për Pagesë ka mbetur i pandryshuar. Pagesë shtesë është bërë.',
            lloji:`Pagese per ${llojiDokumentit2}`,
            eshtePublik:0,
            totaliIPageses:data.totaliPageses,
          })
      
          const transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)

        let emertimiMenyresPageses = 'mbetjaPerPagese'

      if(data.llojiDokumentit == 'servisimi'){ // kjo bohet per shkak se ne databaze tabela servisimi e ka emertimin ndryshe ( gabim sintaksor :( )
        emertimiMenyresPageses = 'mbetjaPageses'
      }
      let llojiMeID = llojiDokumentit + 'ID'

      const updateQuery = `UPDATE ${llojiDokumentit}
      SET  totaliPageses = totaliPageses + @totaliPageses, ${emertimiMenyresPageses} = @mbetjaPerPagese
      where ${llojiMeID} = @${llojiMeID}`

      const l = await connection.request()
      .input('totaliPageses',sql.Decimal(10,2),data.totaliPageses)
      .input('mbetjaPerPagese',sql.Decimal(10,2),data.mbetjaPerPagese)
      .input(`${llojiMeID}`,sql.Int,data.IDDokumentit)
      .query(updateQuery)

      data2 = {
        ...data,
        transaksioniID:transaksioniID
      }

      await updateLlojiIDTransaksion(data.IDDokumentit,transaksioniID,connection) 
      let veprimi
        if(llojiDokumentit.toLowerCase().startsWith('b')){
          veprimi = '-'
        }else{
          veprimi =  '+'
        }
      
        if(llojiDokumentit == 'shitje' || llojiDokumentit == 'servisimi'){ // pasi qe shtohet pagesa e kontrollon nese pagesa osht e plote me rregullu statusin!
          let statusi;
        if (data.mbetjaPerPagese <= 0) {
          statusi =  0;
        } else {
          statusi =  1;
        }

        const updateProfiti = `
        UPDATE profiti
        SET 
          statusi = @statusi,
          dataProfitit = @dataProfitit
        WHERE 
          transaksioniID = @transaksioniID
      `;

      await connection.request()
        .input('transaksioniID', sql.Int, data.transaksioniID) 
        .input('dataProfitit', sql.DateTime, dataDheOra) 
        .input('statusi', sql.Int, statusi) 
        .query(updateProfiti);
      }

      await insertPagesa(data2,connection)
      await ndryshoBalancin(data2.menyraPagesesID,data2.totaliPageses,veprimi,connection,data.perdoruesiID,data.nderrimiID)
      await ndryshoGjendjenEArkes(data2.menyraPagesesID,data2.totaliPageses,veprimi,data.nderrimiID,connection,data.perdoruesiID)

      return { success: true };
    } catch (error) {
      console.error('Database error:', error);
      return { success: false, error: error.message };
    } 
  });
  
ipcMain.handle('paguajPagen', async (event, data) => {
    let connection;
    let dataDheOra
    try {
      // Connect to the database
      connection = await sql.connect(config);
      const shifra = await generateNextShifra('paga', 'PG',connection);
      const shumaPerPagese = Number(data.paga) + Number(data.bonusi) - Number(data.zbritje)
      dataDheOra = await getDateTime();

      dataPerTransaksion = ({
        shifra,
        lloji: 'Pagese Page',
        totaliPerPagese:shumaPerPagese,
        totaliIPageses:shumaPerPagese,
        mbetjaPerPagese:0,
        dataDheOra,
        perdoruesiID:data.perdoruesiID,
        nderrimiID:data.nderrimiID,
        komenti:'',
        pershkrimi:'Pages Page e Punonjesit',
        eshtePublik:0
      })
      console.log(dataPerTransaksion)

      const transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)

      const insert = `
          INSERT INTO paga (
            punonjesID, dataPageses, paga, bonusi, zbritje, menyraPagesesID,transaksioniID,shifra
          )
          OUTPUT INSERTED.pagaID 
          VALUES (
            @punonjesID, @dataPageses, @paga, @bonusi, @zbritje, @menyraPagesesID,@transaksioniID,@shifra
          )
        `;

        console.log('Data to Insert:', data);

        const result = await connection.request()
          .input('punonjesID', sql.Int, data.punonjesID)
          .input('dataPageses', sql.DateTime, dataDheOra)
          .input('paga', sql.Decimal(18, 2), data.paga)
          .input('bonusi', sql.Decimal(18, 2), data.bonusi)
          .input('zbritje', sql.Decimal(18, 2), data.zbritje)
          .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
          .input('transaksioniID', sql.Int, transaksioniID)
          .input('shifra', sql.VarChar, shifra)
          .query(insert);

        const pagaID = result.recordset[0].pagaID;


        await updateLlojiIDTransaksion(pagaID, transaksioniID, connection);


      await ndryshoBalancin(data.menyraPagesesID,shumaPerPagese,'-',connection,data.perdoruesiID,data.nderrimiID)
      await ndryshoGjendjenEArkes(data.menyraPagesesID,shumaPerPagese,'-',data.nderrimiID,connection,data.perdoruesiID)

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Paga',
        pershkrimi: `U shtua pagesa e pagës për punonjesin: ${data.emriPunonjesit + ' ' + data.mbiemriPunonjesit}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };
    } catch (error) {
      console.error('Database error:', error);
      return { success: false, error: error.message };
    } finally {
        
    }
  });

ipcMain.handle('transferoMjetet', async (event, data) => {
    let connection;
    let dataDheOra = await getDateTime()
    try {
      // Connect to the database
      connection = await sql.connect(config);

      const shifra = await generateNextShifra('transferetBankare', 'TB',connection);
      const dataPerTransaksion = ({
        shifra,
        lloji: 'Transfer Bankar',
        totaliPerPagese:data.shuma,
        totaliIPageses:data.shuma,
        mbetjaPerPagese:0,
        dataDheOra,
        perdoruesiID:data.perdoruesiID,
        nderrimiID:data.nderrimiID,
        komenti:'',
        pershkrimi:`Transfer nga ${data.ngaOpsioniEmertimi} në ${data.neOpsioniEmertimi}`,
        eshtePublik:0
      })

      const transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)
      
      const insertQuery = `INSERT INTO transferetBankare 
          (transaksioniID, ngaMenyraPagesesID, neMenyraPagesesID, balanci, nderrimiID, dataTransferit,perdoruesiID,shifra) 
          VALUES (@transaksioniID, @ngaMenyraPagesesID, @neMenyraPagesesID, @balanci, @nderrimiID, @dataTransferit, @perdoruesiID,@shifra)`;

      await connection.request()
        .input('transaksioniID', sql.Int, transaksioniID)
        .input('ngaMenyraPagesesID', sql.Int, data.ngaOpsioniID)
        .input('neMenyraPagesesID', sql.Int, data.neOpsioniID)
        .input('balanci', sql.Decimal(18, 2), data.shuma)
        .input('nderrimiID', sql.Int, data.nderrimiID)
        .input('dataTransferit', sql.DateTime, dataDheOra)
        .input('perdoruesiID', sql.Int, data.perdoruesiID)
        .input('shifra', sql.VarChar, shifra)
        .query(insertQuery);
      
      await ndryshoBalancin(data.ngaOpsioniID,data.shuma,'-',connection,data.perdoruesiID,data.nderrimiID)
      await ndryshoBalancin(data.neOpsioniID,data.shuma,'+',connection,data.perdoruesiID,data.nderrimiID)

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Transferimi i Mjeteve',
        pershkrimi: `U transferuan mjete nga menyra e pageses ${data.ngaOpsioniEmertimi} ne menyren e pageses ${data.neOpsioniEmertimi}`,
        nderrimiID: data.nderrimiID
      })
      return { success: true };
    } catch (error) {
      console.error('Database error:', error);
      return { success: false, error: error.message };
    } finally {
        
    }
  });

ipcMain.handle('insertBlerje', async (event, data) => {
  let connection;
  let dataDheOra

  try {
    dataDheOra = await getDateTime(); 

    connection = await sql.connect(config);

    const shifra = await generateNextShifra('blerje', 'B',connection);

      const dataPerTransaksion = ({
        ...data,
        totaliIPageses:data.totaliPageses,
        shifra:shifra,
        dataDheOra,
        lloji:'Blerje',
        eshtePublik:0
      })
  
      const transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)
    const insertBlerjeQuery = `
      INSERT INTO blerje (
        shifra, totaliPerPagese, totaliPageses, mbetjaPerPagese,dataBlerjes, dataFatures, komenti, fatureERregullt,nrFatures, perdoruesiID, subjektiID, transaksioniID,menyraPagesesID, nderrimiID
      ) OUTPUT INSERTED.blerjeID VALUES (
        @shifra, @totaliPerPagese, @totaliPageses, @mbetjaPerPagese, @dataBlerjes, @dataFatures, @komenti, @fatureERregullt,@nrFatures, @perdoruesiID,@subjektiID, @transaksioniID, @menyraPagesesID,@nderrimiID
      )
    `;
        const fatureERregulltValue = data.fatureERregullt ? 1 : 0;

    const blerjeResult = await connection.request()
      .input('shifra', sql.VarChar, shifra)
      .input('totaliPerPagese', sql.Decimal(18, 2), data.totaliPerPagese)
      .input('totaliPageses', sql.Decimal(18, 2), data.totaliPageses)
      .input('mbetjaPerPagese', sql.Decimal(18, 2), data.mbetjaPerPagese)
      .input('dataBlerjes', sql.DateTime, dataDheOra)
      .input('dataFatures', sql.Date, data.dataFatures)
      .input('komenti', sql.VarChar, data.komenti)
      .input('fatureERregullt', sql.Bit, fatureERregulltValue)
      .input('nrFatures', sql.VarChar, data.nrFatures)
      .input('perdoruesiID', sql.Int, data.perdoruesiID)
      .input('subjektiID', sql.Int, data.subjektiID)
      .input('transaksioniID', sql.Int, transaksioniID)
      .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
      .input('nderrimiID', sql.Int, data.nderrimiID)
      .query(insertBlerjeQuery);

    const blerjeID = blerjeResult.recordset[0].blerjeID;

    await updateLlojiIDTransaksion(blerjeID,transaksioniID,connection)
    const insertBlerjeProdukt = `
    INSERT INTO blerjeProdukt (
      cmimiPerCope, sasia, totaliProduktit,totaliTvsh,blerjeID,produktiID
    ) VALUES (
       @cmimiPerCope, @sasia, @totaliProduktit,@totaliTvsh,@blerjeID,@produktiID
    )
    `;

    for (const produkt of data.produktet) {
    if (produkt.produktiID && produkt.sasiaBlerjes && produkt.cmimiPerCope) {
      const totali = produkt.cmimiBlerjes * produkt.sasiaBlerjes
      await connection.request()
        .input('cmimiPerCope', sql.Decimal(18, 2), produkt.cmimiBlerjes)
        .input('sasia', sql.Int, produkt.sasiaBlerjes)
        .input('totaliProduktit', sql.Decimal(18, 2), totali)
        .input('totaliTvsh', sql.Decimal(18, 2), (totali*produkt.tvsh)/100)
        .input('blerjeID', sql.Int, blerjeID)
        .input('produktiID', sql.Int, produkt.produktiID)
        .query(insertBlerjeProdukt);

 
        
      const updateProduktiQuery = `
        UPDATE produkti
        SET sasia = sasia + @sasia
        WHERE produktiID = @produktiID
      `;
      
      await connection.request()
        .input('produktiID', sql.Int, produkt.produktiID)
        .input('sasia', sql.Int, produkt.sasiaBlerjes)
        .query(updateProduktiQuery);
    
    }
    }

      const dataPerPagesa = {
        totaliPageses:data.totaliPageses,
        dataDheOra,
        shifra,
        transaksioniID,
        subjektiID:data.subjektiID,
        menyraPagesesID:data.menyraPagesesID,
        perdoruesiID:data.perdoruesiID,
        nderrimiID:data.nderrimiID
      }
     if(data.totaliPageses != 0){
        await insertPagesa(dataPerPagesa,connection)
     }

      await ndryshoBalancin(data.menyraPagesesID,data.totaliPageses,'-',connection,data.perdoruesiID,data.nderrimiID)
      await ndryshoGjendjenEArkes(data.menyraPagesesID,data.totaliPageses,'-',data.nderrimiID,connection,data.perdoruesiID)

     await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Blerje',
        pershkrimi: `U shtua blerja me shifer: ${shifra}`,
        nderrimiID: data.nderrimiID
      })

    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('insertShitje', async (event, data) => {
  let connection;
  let dataDheOra;
  let transaksioniID = null;

  try {
      dataDheOra = await getDateTime();
      connection = await sql.connect(config); 

      const shifra = await generateNextShifra('shitje', 'SH', connection);
      let transaksioniID 
      if (data.lloji == 'dyqan') {

              const dataPerTransaksion = ({
                ...data,
                totaliIPageses:data.totaliPageses,
                shifra:shifra,
                dataDheOra,
                lloji:'Shitje',
                eshtePublik:1
              })
    
              transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)
      }

      // Insert into shitje
      const insertShitjeQuery = `
          INSERT INTO shitje (
              shifra, lloji, komenti, totaliPerPagese, totaliPageses, mbetjaPerPagese, dataShitjes, menyraPagesesID, perdoruesiID, transaksioniID, subjektiID,nderrimiID,kohaGarancionit
          ) OUTPUT INSERTED.shitjeID VALUES (
              @shifra, @lloji, @komenti, @totaliPerPagese, @totaliPageses, @mbetjaPerPagese, @dataShitjes, @menyraPagesesID, @perdoruesiID, @transaksioniID, @subjektiID,@nderrimiID,@kohaGarancionit
          )
      `;

      const shitjeResult = await connection.request()
          .input('shifra', sql.VarChar, shifra)
          .input('lloji', sql.VarChar, data.lloji)
          .input('komenti', sql.VarChar, data.komenti)
          .input('totaliPerPagese', sql.Decimal(18, 2), data.totaliPerPagese)
          .input('totaliPageses', sql.Decimal(18, 2), data.totaliPageses)
          .input('mbetjaPerPagese', sql.Decimal(18, 2), data.mbetjaPerPagese)
          .input('dataShitjes', sql.DateTime, dataDheOra)
          .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
          .input('perdoruesiID', sql.Int, data.perdoruesiID)
          .input('transaksioniID', sql.Int, transaksioniID)
          .input('subjektiID', sql.Int, data.subjektiID)
          .input('nderrimiID', sql.Int, data.nderrimiID)
          .input('kohaGarancionit', sql.Int, data.kohaGarancionit)
          .query(insertShitjeQuery);

            const shitjeID = shitjeResult.recordset[0].shitjeID;

            await updateLlojiIDTransaksion(shitjeID,transaksioniID,connection)

            const insertShitjeOnline = `
            INSERT INTO shitjeOnline (
                shitjeID,statusi,nrPorosise,profitiID
            ) VALUES (
                @shitjeID,@statusi,@nrPorosise,@profitiID               
            )`

            

          const insertShitjeProduktiQuery = `
          INSERT INTO shitjeProdukti (
            shitjeID, produktiID, sasia, cmimiShitjesPerCope, totaliProduktit, komenti, profitiProduktit
          ) VALUES (
            @shitjeID, @produktiID, @sasia, @cmimiShitjesPerCope, @totaliProduktit, @komenti, @profitiProduktit
          )
          `;
    

          let profitiShitjes = 0
          let profitiPerBonuse = 0
          for (const produkt of data.produktet) {

            await connection.request()
              .input('shitjeID', sql.Int, shitjeID)
              .input('produktiID', sql.Int, produkt.produktiID)
              .input('sasia', sql.Int, produkt.sasiaShitjes)
              .input('cmimiShitjesPerCope', sql.Decimal(18, 2), produkt.cmimiPerCope)
              .input('totaliProduktit', sql.Decimal(18, 2), produkt.cmimiPerCope * produkt.sasiaShitjes)
              .input('komenti', sql.VarChar, produkt.komenti)
              .input('profitiProduktit', sql.Decimal(18, 2), produkt.profiti)
              .query(insertShitjeProduktiQuery);

              if(produkt.meFatureTeRregullt == 'po'){

                let tvshHyrese = (produkt.cmimiBlerjes * produkt.sasiaShitjes) * produkt.tvsh / 100
                let tvshDalese = produkt.vleraTotaleProduktit * produkt.tvsh / 100
                let tvsh = tvshDalese - tvshHyrese
                profitiPerBonuse = (produkt.profiti - tvsh) + profitiPerBonuse
                profitiShitjes = produkt.profiti + profitiShitjes
                console.log('produkt me fature',produkt,profitiPerBonuse,profitiShitjes,tvsh)

              }else if(produkt.meFatureTeRregullt == 'jo'){

                profitiShitjes = produkt.profiti + profitiShitjes
                profitiPerBonuse = produkt.profiti + profitiPerBonuse
                console.log('produkt pa fature',produkt,profitiPerBonuse,profitiShitjes)

              }

              if(!produkt.sasiStatike){
                const updateProduktiQuery = `
                UPDATE produkti
                SET sasia = sasia - @sasia
                WHERE produktiID = @produktiID
              `;
    
              await connection.request()
                .input('produktiID', sql.Int, produkt.produktiID)
                .input('sasia', sql.Int, produkt.sasiaShitjes)
                .query(updateProduktiQuery);
             }
          
          }

          let statusi;
            if ( data.mbetjaPerPagese <= 0) {
              statusi =  0;
            } else {
              statusi =  1;
            }
    
          const profitiID = await insertProfiti(data,profitiShitjes,profitiPerBonuse,transaksioniID,dataDheOra,statusi,connection)

            const dataPerPagesa = {
              totaliPageses:data.totaliPageses,
              dataDheOra,
              shifra,
              transaksioniID,
              subjektiID:data.subjektiID,
              menyraPagesesID:data.menyraPagesesID,
              perdoruesiID:data.perdoruesiID,
              nderrimiID:data.nderrimiID
            }
            if(data.totaliPageses != 0){
              await insertPagesa(dataPerPagesa,connection)
            }

            if(data.lloji == 'online'){
              await connection.request()
              .input('shitjeID', sql.Int, shitjeID)
              .input('statusi', sql.TinyInt, 1)
              .input('nrPorosise', sql.VarChar, data.nrPorosise)
              .input('profitiID', sql.Int, profitiID)
              .query(insertShitjeOnline);
            }

            if(data.lloji == 'dyqan'){
              await ndryshoBalancin(data.menyraPagesesID,data.totaliPageses,'+',connection,data.perdoruesiID,data.nderrimiID)
              await ndryshoGjendjenEArkes(data.menyraPagesesID,data.totaliPageses,'+',data.nderrimiID,connection,data.perdoruesiID) 
            }

           await insertLogs({
            perdoruesiID: data.perdoruesiID,
            komponenta: 'Shitje',
            pershkrimi: `U shtua shitja me shifer: ${shifra}`,
            nderrimiID: data.nderrimiID
           })

    return { success: true,shifra:shifra,shitjeID:shitjeID };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  } 
});

ipcMain.handle('perfundoShitjenOnline', async (event, data) => {
  let connection;
  let dataDheOra;
  let transaksioniID = null;

  try {
      dataDheOra = await getDateTime();
      connection = await sql.connect(config); 

              const dataPerTransaksion = ({
                ...data,
                totaliIPageses:data.totaliIPranuar,
                dataDheOra,
                pershkrimi:`Kosto e postes eshte:${data.kostoPostes} dhe totali i pranuar eshte:${data.totaliIPranuar}`,
                lloji:'Shitje',
                mbetjaPerPagese:0,
                eshtePublik:1
              })
          
               transaksioniID = await insertTransaksionin(dataPerTransaksion,connection)

               await updateLlojiIDTransaksion(data.shitjeID,transaksioniID,connection)
      // Insert into shitje
      const updateShitjeQuery = `
          UPDATE shitje 
            SET totaliPerPagese = @totaliPerPagese,
                totaliPageses = @totaliPageses,       
                mbetjaPerPagese = @mbetjaPerPagese,
                transaksioniID = @transaksioniID,
                dataShitjes = @dataShitjes,
                perdoruesiID = @perdoruesiID,
                nderrimiID = @nderrimiID
            WHERE shitjeID = @shitjeID
      `;

      await connection.request()
          .input('totaliPerPagese', sql.Decimal(18, 2), data.totaliPerPagese)
          .input('totaliPageses', sql.Decimal(18, 2), data.totaliIPranuar)
          .input('mbetjaPerPagese', sql.Decimal(18, 2), 0)
          .input('transaksioniID', sql.Int, transaksioniID)
          .input('dataShitjes', sql.DateTime, dataDheOra)
          .input('perdoruesiID', sql.Int, data.perdoruesiID)
          .input('nderrimiID', sql.Int, data.nderrimiID)
          .input('shitjeID', sql.Int, data.shitjeID)
          .query(updateShitjeQuery);

            const updateShitjeOnline =`
                UPDATE shitjeOnline
                  SET statusi = @statusi,
                      dataPranimit = @dataPranimit,       
                      kostoPostes = @kostoPostes,
                      totaliIPranimit = @totaliIPranimit
                WHERE shitjeID = @shitjeID
            `;

            await connection.request()
              .input('statusi', sql.TinyInt, 0)
              .input('dataPranimit', sql.DateTime, dataDheOra)
              .input('kostoPostes', sql.Decimal(18,2), data.kostoPostes)
              .input('totaliIPranimit', sql.Decimal(18,2), data.totaliIPranuar)
              .input('shitjeID', sql.Int, data.shitjeID)
              .query(updateShitjeOnline);

              const updateProfitiShitjes = `
              UPDATE profiti
              SET 
                shuma = shuma - @kostoPostes,
                shumaPerBonuse = shumaPerBonuse - @kostoPostes,
                statusi = @statusi,
                transaksioniID = @transaksioniID,
                dataProfitit = @dataProfitit
              WHERE 
                profitiID = @profitiID
            `;
        
            await connection.request()
              .input('kostoPostes', sql.Decimal(18, 2), data.kostoPostes)
              .input('transaksioniID', sql.Int, transaksioniID) 
              .input('statusi', sql.Int, 0) 
              .input('dataProfitit', sql.DateTime, dataDheOra) 
              .input('profitiID', sql.Int, data.profitiID) 
              .input('shumaPerBonuse', sql.Int, data.kostoPostes) 
              .query(updateProfitiShitjes);

            const dataPerPagesa = {
              totaliPageses:data.totaliIPranuar,
              dataDheOra,
              shifra:data.shifra,
              transaksioniID,
              subjektiID:data.subjektiID,
              menyraPagesesID:data.menyraPagesesID,
              perdoruesiID:data.perdoruesiID,
              nderrimiID:data.nderrimiID
            }

            await insertPagesa(dataPerPagesa,connection)
            await ndryshoBalancin(data.menyraPagesesID,data.totaliIPranuar,'+',connection,data.perdoruesiID,data.nderrimiID)
            await ndryshoGjendjenEArkes(data.menyraPagesesID,data.totaliIPranuar,'+',data.nderrimiID,connection,data.perdoruesiID)

            await insertLogs({
              perdoruesiID: data.perdoruesiID,
              komponenta: 'Shitje Online',
              pershkrimi: `U perfundua shitja online me shifer: ${data.shifra}`,
              nderrimiID: data.nderrimiID
            })

    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  } 
});

const insertProfiti = async (data, shuma,shumaPerBonuse, transaksioniID, dataDheOra, statusi, connection) => {
  try {
    const insertProfitiShitjes = `
      INSERT INTO profiti (
        shuma, nderrimiID, dataProfitit, transaksioniID, statusi,shumaPerBonuse
      ) 
      OUTPUT INSERTED.profitiID
      VALUES (@shuma, @nderrimiID, @dataProfitit, @transaksioniID, @statusi , @shumaPerBonuse)
    `;

    const result = await connection.request()
      .input('shuma', sql.Decimal(10, 2), shuma)
      .input('nderrimiID', sql.Int, data.nderrimiID)
      .input('dataProfitit', sql.DateTime, dataDheOra) 
      .input('transaksioniID', sql.Int, transaksioniID)
      .input('statusi', sql.Bit, statusi)
      .input('shumaPerBonuse', sql.Decimal(10, 2), shumaPerBonuse)
      .query(insertProfitiShitjes);

    const profitiID = result.recordset[0].profitiID; 

    await insertLogs({
      perdoruesiID: data.perdoruesiID,
      komponenta: 'Profiti',
      pershkrimi: `U shtua profiti me shume: ${shuma}`,
      nderrimiID: data.nderrimiID
    })

    await kalkuloBonuset(); 

    return profitiID; 
  } catch (error) {
    console.error('Error in insertProfiti:', error); // Log meaningful error for debugging
    return null; // Return null in case of an error
  }
};

const kalkuloBonuset = async () => {
  let connection;
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  console.log('inside kalkuloBonuset')
  try {
    connection = await sql.connect(config);
    
    const getProfitQuery = `SELECT SUM(shumaPerBonuse) AS totaliProfititDitor FROM profiti WHERE CAST(dataProfitit AS DATE) = @data`;
    const profitResult = await connection.request()
      .input('data', sql.Date, formattedDate)
      .query(getProfitQuery);
    
    const totaliProfititDitor = profitResult.recordset[0]?.totaliProfititDitor || 0;

    const bonusiDitor = totaliProfititDitor >= 200 ? Math.floor((totaliProfititDitor - 200) / 100) * 5 + 10 : 0;

    const getBonusQuery = `SELECT bonusetID FROM bonuset WHERE CAST(dataBonuseve AS DATE) = @todayDate`;
    const bonusResult = await connection.request()
      .input('todayDate', sql.Date, formattedDate)
      .query(getBonusQuery);

    const bonusetID = bonusResult.recordset[0]?.bonusetID;

    if (bonusetID && bonusiDitor > 0) {
      await connection.request()
        .input('bonusiDitor', sql.Int, bonusiDitor)
        .input('bonusetID', sql.Int, bonusetID)
        .query(`UPDATE bonuset SET shuma = @bonusiDitor WHERE bonusetID = @bonusetID`);
      
      console.log('Bonus updated:', bonusiDitor);
      
    } else if (!bonusetID && bonusiDitor > 0) {
      await connection.request()
        .input('bonusiDitor', sql.Int, bonusiDitor)
        .input('formattedDate', sql.Date, formattedDate)
        .query(`INSERT INTO bonuset (shuma, dataBonuseve) VALUES (@bonusiDitor, @formattedDate)`);
     
      console.log('Bonus inserted:', bonusiDitor);
    }

    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error };
  } 
};

ipcMain.handle('anuloPorosineOnline', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      // Step 1: Retrieve sold products from shitjeProdukti for the specified transaksioniID
      const getShitjeProduktiQuery = `
        SELECT sp.produktiID, sp.sasia,p.sasiStatike
        FROM shitjeProdukti sp
		    join produkti p on p.produktiID = sp.produktiID
        WHERE shitjeID IN (
          SELECT shitjeID 
          FROM shitje 
          WHERE shitjeID = @shitjeID
        )
      `;

      const shitjeProduktiResult = await connection.request()
        .input('shitjeID', sql.Int, data.shitjeID)
        .query(getShitjeProduktiQuery);

      const soldProducts = shitjeProduktiResult.recordset;

      // Step 2: Update product quantities in produkti table
      const updateProduktiQuery = `
        UPDATE produkti
        SET sasia = sasia + @sasia
        WHERE produktiID = @produktiID
      `;

      for (const produkt of soldProducts) {
        if(!produkt.sasiStatike){
          await connection.request()
          .input('produktiID', sql.Int, produkt.produktiID)
          .input('sasia', sql.Int, produkt.sasia)
          .query(updateProduktiQuery);
        }
      }

      // Step 3: Delete records from shitjeProdukti, shitje, and transaksioni tables
      const deleteShitjeProduktiQuery = `
        DELETE FROM shitjeProdukti 
        WHERE shitjeID IN (
          SELECT shitjeID 
          FROM shitje 
          WHERE shitjeID = @shitjeID
        )
      `;

      const deleteShitjeQuery = `
        DELETE FROM shitje 
        WHERE shitjeID = @shitjeID
      `;

      const deleteShitjeOnlineQuery = `
      DELETE FROM shitjeOnline
      WHERE shitjeID = @shitjeID
    `;

      await connection.request().input('shitjeID', sql.Int, data.shitjeID).query(deleteShitjeProduktiQuery);
      await connection.request().input('shitjeID', sql.Int, data.shitjeID).query(deleteShitjeOnlineQuery);
      await connection.request().input('shitjeID', sql.Int, data.shitjeID).query(deleteShitjeQuery);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Anulimi i porosisë online',
        pershkrimi: `U anulua porosia online (e pa pranuar!) me shifer: ${data.shifra}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('anuloPorosineOnlineTePranuar', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      // Step 1: Retrieve sold products from shitjeProdukti for the specified transaksioniID
      const getShitjeProduktiQuery = `
        SELECT sp.produktiID, sp.sasia,p.sasiStatike
        FROM shitjeProdukti sp
		    join produkti p on p.produktiID = sp.produktiID
        WHERE shitjeID IN (
          SELECT shitjeID 
          FROM shitje 
          WHERE shitjeID = @shitjeID
        )
      `;

      const shitjeProduktiResult = await connection.request()
        .input('shitjeID', sql.Int, data.shitjeID)
        .query(getShitjeProduktiQuery);

      const soldProducts = shitjeProduktiResult.recordset;


      const getTotaliPageses = `
        select totaliPageses,menyraPagesesID from shitje where shitjeID = @shitjeID
      `;

      const totaliPagesesResult = await connection.request()
        .input('shitjeID', sql.Int, data.shitjeID)
        .query(getTotaliPageses);

      const totaliPageses = totaliPagesesResult.recordset[0].totaliPageses;
      const menyraPagesesID = totaliPagesesResult.recordset[0].menyraPagesesID;

    console.log('totali pageses',totaliPageses)

      // Step 2: Update product quantities in produkti table
      const updateProduktiQuery = `
        UPDATE produkti
        SET sasia = sasia + @sasia
        WHERE produktiID = @produktiID
      `;

      for (const produkt of soldProducts) {
        if(!produkt.sasiStatike){
          await connection.request()
          .input('produktiID', sql.Int, produkt.produktiID)
          .input('sasia', sql.Int, produkt.sasia)
          .query(updateProduktiQuery);
        }
      }

      // Step 3: Delete records from shitjeProdukti, shitje, and transaksioni tables
      const deleteShitjeProduktiQuery = `
        DELETE FROM shitjeProdukti 
        WHERE shitjeID IN (
          SELECT shitjeID 
          FROM shitje 
          WHERE shitjeID = @shitjeID
        )
      `;

      const deleteShitjeQuery = `
        DELETE FROM shitje 
        WHERE shitjeID = @shitjeID
      `;

      const deletePagesaQuery = `
      DELETE FROM pagesa 
      WHERE transaksioniID = @transaksioniID
    `;

      const deleteShitjeOnlineQuery = `
        DELETE FROM shitjeOnline 
        WHERE shitjeID = @shitjeID
      `;

      const deleteProfitiQuery = `
        DELETE FROM profiti 
        WHERE transaksioniID = @transaksioniID
      `;

     

      const deleteTransaksioniQuery = `
        DELETE FROM transaksioni 
        WHERE transaksioniID = @transaksioniID
      `;
      console.log('data PEr anulimin',data)
      await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deletePagesaQuery);
      await connection.request().input('shitjeID', sql.Int, data.shitjeID).query(deleteShitjeOnlineQuery);
      await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteProfitiQuery);
      await connection.request().input('shitjeID', sql.Int, data.shitjeID).query(deleteShitjeProduktiQuery);
      await connection.request().input('shitjeID', sql.Int, data.shitjeID).query(deleteShitjeQuery);
      await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteTransaksioniQuery);

      ndryshoBalancin(menyraPagesesID,totaliPageses,'-',connection,data.perdoruesiID,data.nderrimiID)
      ndryshoGjendjenEArkes(menyraPagesesID,totaliPageses,'-',data.nderrimiID,connection,data.perdoruesiID)
      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Anulimi i porosisë online',
        pershkrimi: `U anulua porosia online (e pranuar!) me shifer: ${data.shifra}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('anuloShitjen', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      // Hapi 1: i marrim produktet e shitura nga tabela shitjeProdukti ne baze te transaksioniID 
      const getShitjeProduktiQuery = `
        SELECT sp.produktiID, sp.sasia, p.sasiStatike 
        FROM shitjeProdukti sp
        join produkti p on p.produktiID = sp.produktiID
        WHERE shitjeID IN (
          SELECT shitjeID 
          FROM shitje 
          WHERE transaksioniID = @transaksioniID
        )
      `;

      const shitjeProduktiResult = await connection.request()
        .input('transaksioniID', sql.Int, data.transaksioniID)
        .query(getShitjeProduktiQuery);

      const soldProducts = shitjeProduktiResult.recordset;

      // Hapi 2: e perditsojme sasine e produkteve

      const updateProduktiQuery = `
        UPDATE produkti
        SET sasia = sasia + @sasia
        WHERE produktiID = @produktiID
      `;

      for (const produkt of soldProducts) {
        if(!produkt.sasiStatike){
          await connection.request()
          .input('produktiID', sql.Int, produkt.produktiID)
          .input('sasia', sql.Int, produkt.sasia)
          .query(updateProduktiQuery);
        }
      }

      // Hapi 3: i fshijme te dhenat nga tabelat  shitjeProdukti,profiti,pagesa, shitje, dhe transaksioni 
      const deleteProfiti = `
      DELETE FROM profiti 
      WHERE  transaksioniID = @transaksioniID
    `;

      const deleteShitjeProduktiQuery = `
        DELETE FROM shitjeProdukti 
        WHERE shitjeID IN (
          SELECT shitjeID 
          FROM shitje 
          WHERE transaksioniID = @transaksioniID
        )
      `;

      const deleteShitjeQuery = `
        DELETE FROM shitje 
        WHERE transaksioniID = @transaksioniID
      `;

      const deleteTransaksioniQuery = `
        DELETE FROM transaksioni 
        WHERE transaksioniID = @transaksioniID
      `;

      const deletePagesaQuery = `
        delete from pagesa 
        where shifra = @shifra
      `
      //ktu fillon pjesa per menaxhim bilanci
      const getShumaMenyraPageses = `
        Select totaliPageses,menyraPagesesID
        from shitje
        where transaksioniID = @transaksioniID
      `
      const getShumaMenyraPagesesResult = await connection.request()
        .input('transaksioniID', sql.Int, data.transaksioniID)
        .query(getShumaMenyraPageses)

        const shumaMenyraPageses = getShumaMenyraPagesesResult.recordset[0]

        //ktu e marrim shifren e shitjes qe dojm me anulu
        const getShifraShitjes = ` 
        Select shifra,nderrimiID
        from shitje
        where transaksioniID = @transaksioniID
      `

      const shifraShitjesResult = await connection.request()
        .input('transaksioniID', sql.Int, data.transaksioniID)
        .query(getShifraShitjes)

        const shifraShitjes = shifraShitjesResult.recordset[0];
        const nderrimiID = shifraShitjesResult.recordset[0].nderrimiID;

      await ndryshoBalancin(shumaMenyraPageses.menyraPagesesID,shumaMenyraPageses.totaliPageses,'-',connection,data.perdoruesiID,data.nderrimiID)
      await ndryshoGjendjenEArkes(shumaMenyraPageses.menyraPagesesID,shumaMenyraPageses.totaliPageses,'-',nderrimiID,connection,data.perdoruesiID)

      await connection.request().input('shifra', sql.VarChar, shifraShitjes.shifra).query(deletePagesaQuery);
      await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteProfiti);
      await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteShitjeProduktiQuery);
      await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteShitjeQuery) 
      await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteTransaksioniQuery);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Anulimi i shitjes',
        pershkrimi: `U anulua shitja me shifer: ${shifraShitjes.shifra}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

const anuloShitjeProdukti = async (data) => {
 let connection 
 connection = await sql.connect(config);
  // Hapi 1: i marrim produktet e shitura nga tabela shitjeProdukti ne baze te shitjeID 
  const getShitjeProduktiQuery = `
  SELECT sp.produktiID, sp.sasia,p.sasiStatike 
  FROM shitjeProdukti sp
  join produkti p on p.produktiID = sp.produktiID
  WHERE shitjeID IN (
    SELECT shitjeID 
    FROM shitje 
    WHERE shitjeID = @shitjeID
  )
`;

console.log('ddddddddddddddddddddddddddddddddddddddd',data)

const shitjeProduktiResult = await connection.request()
  .input('shitjeID', sql.Int, data.shitjeID)
  .query(getShitjeProduktiQuery);

const soldProducts = shitjeProduktiResult.recordset;

// Hapi 2: e perditsojme sasine e produkteve
console.log('soldPrd',soldProducts)

const updateProduktiQuery = `
  UPDATE produkti
  SET sasia = sasia + @sasia
  WHERE produktiID = @produktiID
`;

for (const produkt of soldProducts) {
  if(!produkt.sasiStatike){
    await connection.request()
    .input('produktiID', sql.Int, produkt.produktiID)
    .input('sasia', sql.Int, produkt.sasia)
    .query(updateProduktiQuery);
  }
}

const deleteShitjeProduktiQuery = `
        DELETE FROM shitjeProdukti 
        WHERE shitjeID IN (
          SELECT shitjeID 
          FROM shitje 
          WHERE shitjeID = @shitjeID
        )
      `;

await connection.request().input('shitjeID', sql.Int, data.shitjeID).query(deleteShitjeProduktiQuery);

}

const anuloBlerjeProdukti = async (data) => {
  let connection 
  connection = await sql.connect(config);
   // Hapi 1: i marrim produktet e shitura nga tabela blerjeProdukti ne baze te blerjeID 
   const getBlerjeProduktiQuery = `
    SELECT produktiID, sasia 
    FROM blerjeProdukt 
    WHERE blerjeID IN (
     SELECT blerjeID 
     FROM blerje 
     WHERE blerjeID = @blerjeID
   )
 `;
 
 
 const blerjeProduktiResult = await connection.request()
   .input('blerjeID', sql.Int, data.blerjeID)
   .query(getBlerjeProduktiQuery);
 
 const soldProducts = blerjeProduktiResult.recordset;
 
 // Hapi 2: e perditsojme sasine e produkteve
 
 const updateProduktiQuery = `
   UPDATE produkti
   SET sasia = sasia - @sasia
   WHERE produktiID = @produktiID
 `;
 console.log('produktet e blera fillimisht :',soldProducts)
 for (const produkt of soldProducts) {
   await connection.request()
     .input('produktiID', sql.Int, produkt.produktiID)
     .input('sasia', sql.Int, produkt.sasia)
     .query(updateProduktiQuery);
 }
 
 const deleteBlerjeProduktiQuery = `
         DELETE FROM blerjeProdukt 
         WHERE blerjeID IN (
           SELECT blerjeID 
           FROM blerje 
           WHERE blerjeID = @blerjeID
         )
       `;
 
 await connection.request().input('blerjeID', sql.Int, data.blerjeID).query(deleteBlerjeProduktiQuery);

 }
 

const anuloServisProdukti = async (data) => {
  let connection 
  connection = await sql.connect(config);
   // Hapi 1: i marrim produktet e shitura nga tabela servisProdukti ne baze te servisimiID 
   const getServisProduktiQuery = `
   SELECT sp.produktiID, sp.sasia,p.sasiStatike 
   FROM servisProdukti sp
     join produkti p on p.produktiID = sp.produktiID
   WHERE servisimiID IN (
     SELECT servisimiID 
     FROM servisimi 
     WHERE servisimiID = @servisimiID
   )
 `;
 
 
 const servisProduktiResult = await connection.request()
   .input('servisimiID', sql.Int, data.servisimiID)
   .query(getServisProduktiQuery);
 
 const soldProducts = servisProduktiResult.recordset;
 
 // Hapi 2: e perditsojme sasine e produkteve
 
 const updateProduktiQuery = `
   UPDATE produkti
   SET sasia = sasia + @sasia
   WHERE produktiID = @produktiID
 `;
 
 for (const produkt of soldProducts) {
  if(!produkt.sasiStatike){
    await connection.request()
    .input('produktiID', sql.Int, produkt.produktiID)
    .input('sasia', sql.Int, produkt.sasia)
    .query(updateProduktiQuery);
  }
 }
 
 const deleteServisProduktiQuery = `
         DELETE FROM servisProdukti 
         WHERE servisimiID IN (
           SELECT servisimiID 
           FROM servisimi 
           WHERE servisimiID = @servisimiID
         )
       `;
 
 await connection.request().input('servisimiID', sql.Int, data.servisimiID).query(deleteServisProduktiQuery);
 
 }

ipcMain.handle('anuloBlerjen', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

          // Hapi 1: Marrim produktet e regjistruara ne blerje
          const getBlerjeProduktiQuery = `
          SELECT produktiID, sasia 
          FROM blerjeProdukt 
          WHERE blerjeID IN (
            SELECT blerjeID 
            FROM blerje 
            WHERE transaksioniID = @transaksioniID
          )
        `;

        const blerjeProduktiResult = await connection.request()
          .input('transaksioniID', sql.Int, data.transaksioniID)
          .query(getBlerjeProduktiQuery);

        const produktetEBlera = blerjeProduktiResult.recordset;

        // Hapi 2: Ndryshojme sasine e produkteve 
        const updateProduktiQuery = `
          UPDATE produkti
          SET sasia = sasia - @sasia
          WHERE produktiID = @produktiID
        `;

        for (const produkt of produktetEBlera) {
          await connection.request()
            .input('produktiID', sql.Int, produkt.produktiID)
            .input('sasia', sql.Int, produkt.sasia)
            .query(updateProduktiQuery);
        }

        // Hapi 3: Fshijme te dhenat nga tabelat
        const deleteBlerjeProduktiQuery = `
          DELETE FROM blerjeProdukt 
          WHERE blerjeID IN (
            SELECT blerjeID 
            FROM blerje 
            WHERE transaksioniID = @transaksioniID
          )
        `;

        const deleteBlerjeQuery = `
          DELETE FROM blerje 
          WHERE transaksioniID = @transaksioniID
        `;

        const deleteTransaksioniQuery = `
          DELETE FROM transaksioni 
          WHERE transaksioniID = @transaksioniID
        `;
        const deletePagesaQuery = `
        delete from pagesa 
        where shifra = @shifra
      `
        //ktu fillon pjesa per menaxhim bilanci
      const getShumaMenyraPageses = `
        Select totaliPageses,menyraPagesesID
        from blerje
        where transaksioniID = @transaksioniID
      `
      const getShumaMenyraPagesesResult = await connection.request()
        .input('transaksioniID', sql.Int, data.transaksioniID)
        .query(getShumaMenyraPageses)

        const shumaMenyraPageses = getShumaMenyraPagesesResult.recordset

        //ktu e marrim shifren e blerjes qe dojm me anulu
        const getShifraBlerjes = ` 
        Select shifra
        from blerje
        where transaksioniID = @transaksioniID
      `
      const getShifraBlerjesResult = await connection.request()
      .input('transaksioniID', sql.Int, data.transaksioniID)
      .query(getShifraBlerjes)
      
      const shifraBlerjes = getShifraBlerjesResult.recordset


      for (const shmn of shumaMenyraPageses) {
        await ndryshoBalancin
        (shmn.menyraPagesesID,shmn.totaliPageses,'+',connection)
        await ndryshoGjendjenEArkes(shmn.menyraPagesesID,shmn.totaliPageses,'+',data.nderrimiID,connection,data.perdoruesiID)

      }

        await connection.request().input('shifra', sql.VarChar, shifraBlerjes.shifra).query(deletePagesaQuery);
        await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteBlerjeProduktiQuery);
        await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteBlerjeQuery);
        await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteTransaksioniQuery);

        await insertLogs({
          perdoruesiID: data.perdoruesiID,
          komponenta: 'Anulimi i blerjes',
          pershkrimi: `U anulua blerja me shifer: ${shifraBlerjes.shifra}`,
          nderrimiID: data.nderrimiID
        })

        return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('anuloBonusin', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);
    console.log(data)

      const fetchData = `
      select dataBonuseve from bonuset b 
      join bonusetPunonjesit bn on b.bonusetID = bn.bonusetID
      where transaksioniID = @transaksioniID`

      const fetchDataResult = await connection.request()
      .input('transaksioniID', sql.Int, data.transaksioniID)
      .query(fetchData)
      const dataBonuseve = fetchDataResult.recordset[0].dataBonuseve

       const deleteQuery1 = `
       DELETE FROM bonusetPunonjesit 
       WHERE transaksioniID = @transaksioniID 
     `;

        const deleteQuery2 = `
          DELETE FROM transaksioni 
       WHERE transaksioniID = @transaksioniID 
        `;

      

      const nderrimiID = await getNderrimiID(data.transaksioniID,connection)

      await connection.request()
      .input('transaksioniID', sql.Int, data.transaksioniID)
      .query(deleteQuery1)

      await connection.request()
      .input('transaksioniID', sql.Int, data.transaksioniID)
      .query(deleteQuery2)

      await ndryshoBalancin(data.menyraPagesesID,data.shumaPageses,'+',connection,data.perdoruesiID,data.nderrimiID)
      await ndryshoGjendjenEArkes(data.menyraPagesesID,data.shumaPageses,'+',nderrimiID,connection,data.perdoruesiID) 

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Bonuse',
        pershkrimi: `U anulua bonusi i dates: ${dataBonuseve}, per: ${data.emriPunonjesit} ${data.mbiemriPunonjesit}`,
        nderrimiID: nderrimiID
      })

        return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('anuloShpenzimin', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);


        connection = await sql.connect(config);

       // const getNenLloji = `SELECT nenLloji FROM shpenzimi WHERE transaksioniID = @transaksioniID`;

        //const result = await connection.request()
          //.input('transaksioniID', sql.Int, transaksioniID)
          //.query(getNenLloji);


        const getNenLloji = `
        SELECT nenLloji FROM shpenzimi WHERE transaksioniID = @transaksioniID`;

        const result = await connection.request()
          .input('transaksioniID', sql.Int, data.transaksioniID)
          .query(getNenLloji);

        const nenLloji = result.recordset[0].nenLloji;
        
        if(nenLloji == 'ngaStoku'){ 
          
          // ktu menagjohet nje produkt qe osht hi shpenzim prej stokit
              // Hapi 1: Marrim produktin qe e kemi regjistru si shpenzim
              const getShpenzimProduktQuery = `
              SELECT sp.produktiID, sp.sasia , p.sasiStatike
              FROM shpenzimProdukti sp
              join produkti p on p.produktiID = sp.produktiID
              WHERE shpenzimiID IN (
                SELECT shpenzimiID 
                FROM shpenzimi 
                WHERE transaksioniID = @transaksioniID
              )
            `;
              const shpenzimProduktiResult = await connection.request()
              .input('transaksioniID', sql.Int, data.transaksioniID)
              .query(getShpenzimProduktQuery);

            const Products = shpenzimProduktiResult.recordset;

            // Hapi 2: Ndryshojme sasine e atij produkti
            const updateProduktiQuery = `
              UPDATE produkti
              SET sasia = sasia + @sasia
              WHERE produktiID = @produktiID
            `;

            for (const produkt of Products) {
              if(!produkt.sasiStatike){
                await connection.request()
                .input('produktiID', sql.Int, produkt.produktiID)
                .input('sasia', sql.Int, produkt.sasia)
                .query(updateProduktiQuery);
              }
            }
            console.log('produkti i shpenzimit',data)
            const deleteShpenzimiFromShpenzimProdukt = `
            DELETE FROM shpenzimProdukti 
            WHERE transaksioniID = @transaksioniID
          `
          await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteShpenzimiFromShpenzimProdukt);

         }else{
                    //ktu fillon pjesa per menaxhim bilanci
              const getShuma = `
              Select shumaShpenzimit
              from shpenzimi
              where transaksioniID = @transaksioniID
            `
            const getShumaResult = await connection.request()
              .input('transaksioniID', sql.Int, data.transaksioniID)
              .query(getShuma)

              const shuma = getShumaResult.recordset[0]
              console.log('shuma',shuma)
              const nderrimiID = await getNderrimiID(data.transaksioniID,connection)
              await ndryshoBalancin(data.menyraPagesesID,shuma.shumaShpenzimit,'+',connection,data.perdoruesiID,data.nderrimiID)
              await ndryshoGjendjenEArkes(data.menyraPagesesID,shuma.shumaShpenzimit,'+',nderrimiID,connection,data.perdoruesiID)  
         }

         const deleteShpenzimiFromTransaksioni = `
            DELETE FROM transaksioni 
            WHERE transaksioniID = @transaksioniID
          `
          const deleteShpenzimiQuery = `
            DELETE FROM shpenzimi 
            WHERE transaksioniID = @transaksioniID
          `;
          await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteShpenzimiQuery);
          await connection.request().input('transaksioniID', sql.Int, data.transaksioniID).query(deleteShpenzimiFromTransaksioni);

         await insertLogs({
          perdoruesiID: data.perdoruesiID,
          komponenta: 'Shpenzim',
          pershkrimi: `U anulua shpenzimi`,
          nderrimiID: data.nderrimiID
        })

          return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

const getNderrimiID = async (transaksioniID, connection) => {
  let nderrimiID
  try{
    const getNderrimiID = `
    Select nderrimiID
    from transaksioni
    where transaksioniID = @transaksioniID
  `
  const getNderrimi = await connection.request()
    .input('transaksioniID', sql.Int, transaksioniID)
    .query(getNderrimiID)

    const data = getNderrimi.recordset[0]
    nderrimiID = data.nderrimiID
    console.log('nderrimiID',nderrimiID)
  }catch(e){
    console.log(e)
  }
  return nderrimiID
}

ipcMain.handle('fshijeProduktin', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

    const deleteProduktinQuery = `
      DELETE FROM produkti 
      WHERE produktiID = @produktiID
    `;

    await connection.request().input('produktiID', sql.Int, data.idPerAnulim).query(deleteProduktinQuery);
    
    await insertLogs({
      perdoruesiID: data.perdoruesiID,
      komponenta: 'Produkti',
      pershkrimi: `U fshi nje Produkt!`,
      nderrimiID: data.nderrimiID
    })

    return { success: true };

  } catch (error) {
    console.error('Database error:', error);

    if (error.number == 547) {
      return { success: false, error: 'Ky produkt është përdorur në tabela të tjera dhe nuk mund të fshihet!' };
    }

    return { success: false, error: 'Diçka shkoi keq gjatë fshirjes së produktit!' };
  }  
});


ipcMain.handle('fshijePunonjesin', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      const deleteQuery = `
        DELETE FROM punonjesit 
        WHERE punonjesID = @punonjesID
      `;

      await connection.request().input('punonjesID', sql.Int, data.idPerAnulim).query(deleteQuery);
      
      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Punonjesi',
        pershkrimi: `U fshi Punonjesi: ${data.emri} ${data.mbiemri}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('fshijePagen', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

    const oldDataQuery = `SELECT menyraPagesesID, paga,bonusi,zbritje,transaksioniID FROM paga WHERE pagaID = @pagaID`;
    const oldDataResult = await connection.request()
        .input('pagaID', sql.Int, data.pagaID)
        .query(oldDataQuery);

    if (oldDataResult.recordset.length === 0) {
        throw new Error("Record not found");
    }

    const oldData = oldDataResult.recordset[0];
    const oldMenyraPagesesID = oldData.menyraPagesesID
    const oldBilanci = oldData.paga + oldData.bonusi
    const transaksioniID = oldData.transaksioniID

    console.log(oldMenyraPagesesID,oldBilanci,oldData)
    const nderrimiID = await getNderrimiID(transaksioniID,connection)
    await ndryshoBalancin (oldMenyraPagesesID,oldBilanci,'+',connection)
    await ndryshoGjendjenEArkes(oldMenyraPagesesID,oldBilanci,'+',nderrimiID,connection,data.perdoruesiID)

      
      const deletePagaQuery = `
        DELETE FROM paga 
        WHERE pagaID = @pagaID
      `;
      const deleteTransaksioniQuery = `
      DELETE FROM transaksioni 
      WHERE transaksioniID = @transaksioniID
    `;
      await connection.request().input('pagaID', sql.Int, data.pagaID).query(deletePagaQuery);
      await connection.request().input('transaksioniID', sql.Int, transaksioniID).query(deleteTransaksioniQuery);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Paga',
        pershkrimi: `U anulua Paga me shifer: ${data.shifra} , per punonjesin: ${data.emri}`,
        nderrimiID: nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('deleteKategoria', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      const deleteKategoriaQuery = `
        DELETE FROM kategoria 
        WHERE kategoriaID = @kategoriaID
      `;

      await connection.request().input('kategoriaID', sql.Int, data.idPerAnulim).query(deleteKategoriaQuery);
      
      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Kategoria',
        pershkrimi: `U fshi Kategoria!`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('deleteLlojiShpenzimit', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      const deleteLlojetShpenzimeveQuery = `
        DELETE FROM llojetShpenzimeve 
        WHERE llojetShpenzimeveID = @llojetShpenzimeveID
      `;

      await connection.request().input('llojetShpenzimeveID', sql.Int, data.llojetShpenzimeveID).query(deleteLlojetShpenzimeveQuery);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Lloji i Shpenzimeve',
        pershkrimi: `U fshi Lloji i Shpenzimeve: ${data.emertimi}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('deletePushimi', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      const deleteLlojetShpenzimeveQuery = `
        DELETE FROM pushimet 
        WHERE pushimID = @pushimID
      `;

      await connection.request().input('pushimID', sql.Int, data.pushimID).query(deleteLlojetShpenzimeveQuery);

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Pushimi',
        pershkrimi: `U Anulua Pushimi Per Punonjesin:${data.emri} ${data.mbiemri}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});


ipcMain.handle('ndryshoKategorine', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      const updateKategoriaQuery = `
        Update Kategoria 
        SET emertimi = @emertimi,
            tvsh = @tvsh,
            komponenta = @komponenta
        where kategoriaID = @kategoriaID
      `;

      await connection.request()
      .input('emertimi', sql.VarChar, data.emertimi)
      .input('tvsh', sql.Int, data.tvsh)
      .input('komponenta', sql.VarChar, data.komponenta)
      .input('kategoriaID', sql.Int, data.kategoriaID)
      .query(updateKategoriaQuery);   


      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Kategoria',
        pershkrimi: `U ndryshua Kategoria: ${data.emertimi}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('ndryshoPagen', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);
      const oldDataQuery = `SELECT menyraPagesesID, paga,bonusi,zbritje,transaksioniID FROM paga WHERE pagaID = @pagaID`;
      const oldDataResult = await connection.request()
          .input('pagaID', sql.Int, data.pagaID)
          .query(oldDataQuery);

      if (oldDataResult.recordset.length === 0) {
          throw new Error("Record not found");
      }

      const oldData = oldDataResult.recordset[0];
      const oldBalanci = oldData.paga + oldData.bonusi ;
      const newBalanci = Number(data.paga) +Number(data.bonusi)  - Number(data.zbritje)
      const transaksioniID = oldData.transaksioniID
      let diferenca = oldBalanci - newBalanci
      console.log('oldData',oldData)
      console.log('diferenca',diferenca)

      await ndryshoBalancin(oldData.menyraPagesesID,diferenca,'+',connection,data.perdoruesiID,data.nderrimiID)
      const nderrimiID = await getNderrimiID(transaksioniID,connection)
      await ndryshoGjendjenEArkes(oldData.menyraPagesesID,diferenca,'+',nderrimiID,connection,data.perdoruesiID)

      const update = `
        Update paga 
        SET paga = @paga,
            bonusi = @bonusi,
            zbritje = @zbritje,
            menyraPagesesID = @menyraPagesesID
        where pagaID = @pagaID
      `;

      await connection.request()
      .input('paga', sql.Decimal(18,2), data.paga)
      .input('bonusi', sql.Decimal(18,2), data.bonusi)
      .input('zbritje', sql.Decimal(18,2), data.zbritje)
      .input('pagaID', sql.Int, data.pagaID)
      .input('menyraPagesesID', sql.Int, data.menyraPagesesID)
      .query(update);   


      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Paga',
        pershkrimi: `U ndryshua Paga me shifer: ${data.shifra}`,
        nderrimiID: nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('ndryshoShpenzimin', async (event, data) => {
  let connection;
  try {
    connection = await sql.connect(config);

    const getShuma = `
      Select shumaShpenzimit
      from shpenzimi
      where transaksioniID = @transaksioniID
    `
    const getShumaResult = await connection.request()
    .input('transaksioniID', sql.Int, data.transaksioniID)
    .query(getShuma)

    const shuma = getShumaResult.recordset[0]
    let shumaFillestare = shuma.shumaShpenzimit

    // Single request to reuse between queries
    const request = connection.request()
      .input('totaliperPagese', sql.Decimal(10,2), data.shumaShpenzimit)
      .input('totaliIPageses', sql.Decimal(10,2), data.shumaShpenzimit)
      .input('komenti', sql.VarChar, data.komenti)
      .input('transaksioniID', sql.Int, data.transaksioniID)
      .input('llojetShpenzimeveID', sql.Int, data.llojetShpenzimeveID)
      .input('shumaShpenzimit', sql.Decimal(10,2), data.shumaShpenzimit)
      .input('shpenzimiID', sql.Int, data.shpenzimiID)
      .input('menyraPagesesID', sql.Int, data.menyraPagesesID)

    // Update transaksioni query
    const updateTransaksioniQuery = `
      UPDATE transaksioni
      SET totaliperPagese = @totaliperPagese,
          totaliIPageses = @totaliIPageses,
          komenti = @komenti
      WHERE transaksioniID = @transaksioniID
    `;

    await request.query(updateTransaksioniQuery);

    // Update shpenzimi query
    const updateShpenzimiQuery = `
      UPDATE shpenzimi 
      SET llojetShpenzimeveID = @llojetShpenzimeveID,
          shumaShpenzimit = @shumaShpenzimit,
          komenti = @komenti,
          menyraPagesesID = @menyraPagesesID  
        WHERE shpenzimiID = @shpenzimiID
    `;
    await request.query(updateShpenzimiQuery);

      //ktu fillon pjesa per menaxhim bilanci

      let nderrimiID = await getNderrimiID(data.transaksioniID,connection)

      await ndryshoBalancin(data.menyraPagesesIDFillestare,shumaFillestare,'+',connection,data.perdoruesiID,data.nderrimiID)
      await ndryshoGjendjenEArkes(data.menyraPagesesIDFillestare,shumaFillestare,'+',nderrimiID,connection,data.perdoruesiID)

      await ndryshoBalancin(data.menyraPagesesID,data.shumaShpenzimit,'-',connection,data.perdoruesiID,data.nderrimiID)
      await ndryshoGjendjenEArkes(data.menyraPagesesID,data.shumaShpenzimit,'-',nderrimiID,connection,data.perdoruesiID)

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Shpenzimi',
        pershkrimi: `U ndryshua shpenzimi me shifer: ${data.shifra}`,
        nderrimiID: nderrimiID
      })

    return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message }; // Returning a detailed error
  }  
});

ipcMain.handle('ndryshoLlojinShpenzimit', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      const updateLlojetShpezimeveQuery = `
        Update llojetShpenzimeve 
        SET emertimi = @emertimi,
            shumaStandarde = @shumaStandarde
        where llojetShpenzimeveID = @llojetShpenzimeveID
      `;

      await connection.request()
      .input('emertimi', sql.VarChar, data.emertimi)
      .input('shumaStandarde', sql.Decimal(10,2), data.shumaStandarde)
      .input('llojetShpenzimeveID', sql.Int, data.llojetShpenzimeveID)
      .query(updateLlojetShpezimeveQuery);   

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Lloji i Shpenzimeve',
        pershkrimi: `U ndryshua Lloji i Shpenzimeve: ${data.emertimi}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('ndryshoPushimin', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

   

      const updateLlojetShpezimeveQuery = `
        Update pushimet 
        SET dataFillimit = @dataFillimit,
            dataMbarimit = @dataMbarimit,
            lloji = @lloji,
            arsyeja = @arsyeja,
            nrDiteve = @nrDiteve
        where pushimID = @pushimID
      `;

      await connection.request()
      .input('dataFillimit', sql.Date, data.dataFillimit)
      .input('dataMbarimit', sql.Date, data.dataMbarimit)
      .input('lloji', sql.VarChar, data.lloji)
      .input('arsyeja', sql.VarChar, data.arsyeja)
      .input('nrDiteve', sql.Int, data.nrDiteve)
      .input('pushimID', sql.Int, data.pushimID)
      .query(updateLlojetShpezimeveQuery);   

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Pushimi',
        pershkrimi: `U ndryshua Pushimi per Punonjesin: ${data.emri} ${data.mbiemri}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

    

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});


ipcMain.handle('ndryshoPunonjes', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);

      const updatePunonjes = `
        Update punonjesit 
        SET emri = @emri,
            mbiemri = @mbiemri,
            pagaBaze = @pagaBaze,
            aktiv = @aktiv,
            nrTelefonit = @nrTelefonit
        where punonjesID = @punonjesID
      `;

      await connection.request()
      .input('emri', sql.VarChar, data.emri)
      .input('mbiemri', sql.VarChar, data.mbiemri)
      .input('pagaBaze', sql.Decimal(10,2), data.pagaBaze)
      .input('aktiv', sql.Int, data.aktiv)
      .input('nrTelefonit', sql.VarChar, data.nrTelefonit)
      .input('punonjesID', sql.Int, data.punonjesID)
      .query(updatePunonjes);   

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Punonjesi',
        pershkrimi: `U ndryshua Punonjesi: ${data.emri} ${data.mbiemri}`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

ipcMain.handle('ndryshoParametrat', async (event, data) => {
  let connection;

  try {
    connection = await sql.connect(config);
    const kushtetJSON = JSON.stringify(data.kushtet)

      const updateParametrat = `
        Update parametratGarancionit 
        SET emriBiznesit = @emriBiznesit,
            adresa = @adresa,
            telefoni = @telefoni,
            kushtet = @kushtet,
            filePath = @filePath
        where parametratGarancionitID = @parametratGarancionitID
      `;

      await connection.request()
      .input('emriBiznesit', sql.NVarChar, data.parametratGarancionit.emriBiznesit)
      .input('adresa', sql.NVarChar, data.parametratGarancionit.adresa)
      .input('telefoni', sql.NVarChar, data.parametratGarancionit.telefoni)
      .input('kushtet', sql.NVarChar, kushtetJSON)
      .input('filePath', sql.NVarChar, data.parametratGarancionit.filePath)
      .input('parametratGarancionitID', sql.Int, data.parametratGarancionit.parametratGarancionitID)
      .query(updateParametrat);   

      await insertLogs({
        perdoruesiID: data.perdoruesiID,
        komponenta: 'Parametrat e Garancionit',
        pershkrimi: `U ndryshuan parametrat e garancionit`,
        nderrimiID: data.nderrimiID
      })

      return { success: true };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error.message };
  }  
});

//per me shkru garancion
ipcMain.on('savePDF', (event, { pdfBase64, folderPath, fileName }) => { const filePath = path.join(folderPath, fileName); const buffer = Buffer.from(pdfBase64, 'base64'); fs.writeFile(filePath, buffer, (error) => { if (error) { console.error('Failed to save PDF:', error); } else { console.log('PDF saved successfully to', filePath); } }); });

ipcMain.on('openFile', (event, filePath) => { shell.openPath(filePath) .then(() => console.log('File opened successfully')) .catch((error) => console.error('Failed to open file:', error)); });



ipcMain.handle('print-label', async (event, contentHTML) => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { webSecurity: false }
  });

  try {
    await win.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(contentHTML)}`);

    const options = {
      silent: false,
      deviceName: 'LabeledPrinter', 
      pageSize: {
        width: 50800,   
        height: 25400   
      },
      margins: { marginType: 'none' },
      printBackground: true,
      landscape: false,
      scaleFactor: 100
    };

    win.webContents.print(options, (success, err) => {
      if (!success) console.error('Print failed:', err);
      win.destroy();
    });
  } catch (e) {
    console.error('Print error:', e);
    win.destroy();
  }
});

ipcMain.handle('load-db-config', () => {
  return loadConfig();
});

ipcMain.handle('save-db-config', (event, config) => {
  saveConfig(config);
});

ipcMain.handle('select-pdf-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const config = loadConfig();
    config.pdfFolder = result.filePaths[0];
    saveConfig(config);
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('save-excel', async (_, args) => {
  const { fileName } = args

  // Normalize to an array of { name, data } objects
  const sheetDefs = Array.isArray(args.sheets)
    ? args.sheets
    : [{ name: 'Sheet1', data: Array.isArray(args.data) ? args.data : [] }]

  // 1) Ask the user where to save
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save Excel File',
    defaultPath: fileName,
    filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
  })
  if (canceled || !filePath) return { success: false }

  // 2) Build the workbook
  const wb = XLSX.utils.book_new()

  sheetDefs.forEach(({ name, data }) => {
    if (!Array.isArray(data) || data.length === 0) return

    // derive headers & rows
    const headers = Object.keys(data[0])
    const rows = data.map(row => headers.map(h => row[h]))

    // create the sheet
    const ws = XLSX.utils.aoa_to_sheet([ headers, ...rows ])

    // optional: set column widths
    ws['!cols'] = headers.map(() => ({ wch: 15 }))

    // optional: enable autofilter on the header row
    const lastCol = String.fromCharCode(65 + headers.length - 1)
    ws['!autofilter'] = { ref: `A1:${lastCol}${rows.length + 1}` }

    // append under the given name
    XLSX.utils.book_append_sheet(wb, ws, name)
  })

  // 3) Write the file
  XLSX.writeFile(wb, filePath)
  return { success: true, filePath }
})

const createWindow = () => {
  const win = new BrowserWindow({
    autoHideMenuBar: true, 
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'), // Ensure the correct path to preload.js
      contextIsolation: true,  // Enable context isolation for security
      nodeIntegration: true,  // Disable nodeIntegration for security
      enableRemoteModule: false,
      webSecurity:false
,
    }
  });
  win.maximize()
  win.loadURL('http://localhost:5173'); // Assuming your React app is running on localhost:3000
 
  const filePath = path.join(__dirname, 'my-react-app', 'dist', 'index.html');
  
  //win.loadURL(`file://${filePath}`);
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
