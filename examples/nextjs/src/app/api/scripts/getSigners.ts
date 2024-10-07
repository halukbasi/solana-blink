
const fetchAddressForSignature = async (signature: string) => {
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
    // console.log(data.result.transaction.message.accountKeys[0]);

    return data.result.transaction.message.accountKeys[0];
  } catch (error) {
    console.error('Error fetching addresses:', error);
  }
};

export default fetchAddressForSignature;

