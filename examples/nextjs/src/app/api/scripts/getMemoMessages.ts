
const fetchSignaturesForAddress = async () => {
  const url = "https://api.devnet.solana.com";
  // const connection = new Connection(
  //   process.env.SOLANA_RPC! || clusterApiUrl('mainnet-beta'),
  // );
  
  // JSON RPC payload'ı
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "getSignaturesForAddress",
    params: [
      "6wbNVswVdbSAakfojVxY5DRLh3J5simMSajU2aoC4JUP", // Vote account adresi
    ]
  };

  try {
    // fetch ile POST isteği gönderiyoruz
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Yanıtı JSON formatında alıyoruz
    const data = await response.json();
    for(let i = 0; i < data.result.length; i++) {
        if((data.result[i].memo && data.result[i].memo.slice(-9) == "gmail.com") || (data.result[i].memo && data.result[i].memo.slice(-11) == "outlook.com") || (data.result[i].memo && data.result[i].memo.slice(-11) == "hotmail.com")) {
          console.log(data.result[i].memo);
        }
        }

    // Ekrana yanıtı yazdırıyoruz
    // console.log('Signatures for Address:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching signatures:', error);
  }
};

// Fonksiyonu çağırıyoruz
fetchSignaturesForAddress();