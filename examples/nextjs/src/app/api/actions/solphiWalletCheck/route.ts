import {
    createPostResponse,
    createActionHeaders,
    ActionPostResponse,
    ActionGetResponse,
    ActionPostRequest,
  } from '@solana/actions';
  import {
    clusterApiUrl,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
  } from '@solana/web3.js';
  
  import "dotenv/config";
  import { getKeypairFromEnvironment } from "@solana-developers/helpers";
  const keypair = getKeypairFromEnvironment("SECRET_KEY");

  const senderSecretKey_ = keypair.secretKey;
  const headers = createActionHeaders();
  let icon_ = 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWU0bzQ4ZDE0N3I1bTJxcTM0cTkwbmpycWdidDAwcDI5OGd2ejhxdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/NKR2s2vqHqETBGTlaX/giphy.gif';

  export const GET = async (req: Request) => {

    try {
      const requestUrl = new URL(req.url);
      const baseHref = new URL(
        `/api/actions/solphiWalletCheck?`,
        requestUrl.origin,
      ).toString();
      const payload: ActionGetResponse = {
        type: 'action',
        title: 'SolΦ Advertisement',
        icon: icon_,
        description:
          'Earn SOL by watching ads.',
        label: 'Transfer', // this value will be ignored since `links.actions` exists
        disabled: false,
        links: {
          actions: [
            {
              label: 'Send', // button text
              href: `${baseHref}receiverWallet={receiverWallet}`, // this href will have a text input
              parameters: [
                {
                  name: 'receiverWallet', // parameter name in the `href` above
                  label: 'Receiver Wallet', // placeholder of the text input
                  required: true,
                },
              ],
            },
          ],
        },
      };
      
      
      return Response.json(payload, {
        headers,
      });

    } catch (err) {
      console.log(err);
      let message = 'An unknown error occurred';
      if (typeof err == 'string') message = err;
      return new Response(message, {
        status: 400,
        headers,
      });
    }
  };
  
  // DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
  // THIS WILL ENSURE CORS WORKS FOR BLINKS
  export const OPTIONS = async (req: Request) => {
    return new Response(null, { headers });
  };
  
  export const POST = async (req: Request) => {
    try {
      
      const requestUrl = new URL(req.url);
      const {toPubkey } = validatedQueryParams(requestUrl);
      const body: ActionPostRequest = await req.json();

      // validate the client provided input
      let account: PublicKey;
      const senderSecretKey = Uint8Array.from(senderSecretKey_);
      const senderWallet = Keypair.fromSecretKey(senderSecretKey);
      try {
        account = new PublicKey(body.account);
        let allWallets = await fetchAllAddresses();
        let checkUserWallet = validatedAddress(account.toBase58(), allWallets);
        let checkReceiverWallet = validatedAddress(toPubkey.toBase58(), allWallets);
        if (checkUserWallet || checkReceiverWallet) {
          return new Response('Claimed!', {
            status: 400,
            headers,
          });
        }
      } catch (err) {
        return new Response('Invalid "account" provided', {
          status: 400,
          headers,
        });
      }

      // const connection = new Connection(
      //   process.env.SOLANA_RPC! || clusterApiUrl('mainnet-beta'),
      // );
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
      // ensure the receiving account will be rent exempt
      const minimumBalance = await connection.getMinimumBalanceForRentExemption(
        0, // note: simple accounts that just store native SOL have `0` bytes of data
      );
      if (0.001 * LAMPORTS_PER_SOL < minimumBalance) {
        throw `account may not be rent exempt: ${toPubkey.toBase58()}`;
      }

      let solphi: PublicKey = new PublicKey(
        'FhEcCfQuwu7yvpZwyKJcu99EbrBoALW7dxtsK6x6Dsfi',
      );
      const transferSolInstruction = SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: solphi,
        lamports: 0.0005 * LAMPORTS_PER_SOL,
      });


      const transferSolInstruction2 = SystemProgram.transfer({
        fromPubkey: senderWallet.publicKey,
        toPubkey: toPubkey,
        lamports: 0.0031 * LAMPORTS_PER_SOL,
      });

      const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

      const transaction = new Transaction({
        feePayer: senderWallet.publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(transferSolInstruction,transferSolInstruction2);

      (async () => {
        try {
          let signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [senderWallet]
          );
          console.log('Transaction confirmed with signature', signature);
        } catch (error) {
          console.error('Transaction failed', error);
        }
      })();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          transaction,
          message: `You have successfully claimed the reward!`,
        },
        // note: no additional signers are needed
        // signers: [],
      });
      return Response.json(payload, {
        headers,
      });
    } catch (err) {
      console.log(err);
      let message = 'An unknown error occurred';
      if (typeof err == 'string') message = err;
      return new Response(message, {
        status: 400,
        headers,
      });
    }
  };

  
  function validatedQueryParams(requestUrl: URL) {
    let toPubkey: PublicKey = new PublicKey(
      'FhEcCfQuwu7yvpZwyKJcu99EbrBoALW7dxtsK6x6Dsfi',
    );
  
    try {
      if (requestUrl.searchParams.get('receiverWallet')) {
        toPubkey = new PublicKey(requestUrl.searchParams.get('receiverWallet')!);
      }
    } catch (err) {
      throw 'Invalid input query parameter: receiverWallet';
    }
  
    return {
      toPubkey,
    };
  }

  function validatedAddress(wallet: string, wallets: string[]) {  
    try {
      if (wallets.includes(wallet)) {
        return true;
      }
      else {
        return false;
      }
    } catch (err) {
      throw 'Invalid input query parameter: validatedAddress';
    }
  }

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
      return signers;
    } catch (error) {
      console.error('Error fetching signers:', error);
      return [];
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
  
      return data.result.transaction.message.accountKeys[1];
    } catch (error) {
      // console.error('Error fetching addresses:', error);
    }
  };
};

  