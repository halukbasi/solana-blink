const fetchAllAddresses = async () => {

    const url = "https://api.devnet.solana.com";
    // const url = "https://api.mainnet-beta.solana.com";
  
    // JSON RPC payload'ı
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "getSignaturesForAddress",
      params: [
        "3ZkXKswL9y7SHjWNGRV7Y5N3eSmwk9uFb5foL2ptpfsu", // Vote account adresi
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
      let signers = [];
      for(let i = 0; i < data.result.length; i++) {
        let signer = await fetchAddressForSignature(data.result[i].signature);
        signers.push(signer);
          }
        signers = signers.filter(signer => signer !== undefined);
      // Ekrana yanıtı yazdırıyoruz
      // console.log('Signatures for Address:', data);
        console.log(signers);
      return signers;
    } catch (error) {
      console.error('Error fetching signers:', error);
    }

  async function fetchAddressForSignature(signature:string) {
    const url = "https://api.devnet.solana.com";
    // const url = "https://api.mainnet-beta.solana.com";
  
    // JSON RPC payload'ı
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [
        signature, // Vote account adresi
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
      console.log(data.result.transaction.message.accountKeys[1]);
  
      return data.result.transaction.message.accountKeys[1];
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };
};
  
  // Fonksiyonu çağırıyoruz
  fetchAllAddresses();