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
    ParsedAccountData,
  } from '@solana/web3.js';
  import {
    getOrCreateAssociatedTokenAccount,
    createTransferInstruction,
  } from "@solana/spl-token";
  
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
        `/api/actions/solphiNft?`,
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

      const MINT_ADDRESS = "Gx1552LXRRPDBpAtcm9CTH8csRXKuFnT6xJZ8PkrnDKb";
      const TRANSFER_AMOUNT = 1;

    const info = await connection.getParsedAccountInfo(
        new PublicKey(MINT_ADDRESS)
    );
    const getNumberDecimals_result = (info.value?.data as ParsedAccountData).parsed.info
        .decimals as number;
        console.log(
        `Sending ${TRANSFER_AMOUNT} ${MINT_ADDRESS} from ${senderWallet.publicKey.toString()} to ${toPubkey}.`
        );
        //Step 1
        console.log(`1 - Getting Source Token Account`);
        let sourceAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        senderWallet,
        new PublicKey(MINT_ADDRESS),
        senderWallet.publicKey
        );
        console.log(`    Source Account: ${sourceAccount.address.toString()}`);
    
        //Step 2
        console.log(`2 - Getting Destination Token Account`);
        let destinationAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        senderWallet,
        new PublicKey(MINT_ADDRESS),
        toPubkey
        );
        console.log(
        `    Destination Account: ${destinationAccount.address.toString()}`
        );
    
        //Step 3
        console.log(`3 - Fetching Number of Decimals for Mint: ${MINT_ADDRESS}`);
    
        const numberDecimals = getNumberDecimals_result;
        console.log(`    Number of Decimals: ${numberDecimals}`);
    
        //Step 4
        console.log(`4 - Creating and Sending Transaction`);

        let solphi: PublicKey = new PublicKey(
          'FhEcCfQuwu7yvpZwyKJcu99EbrBoALW7dxtsK6x6Dsfi',
        );
        const transferSolInstruction = createTransferInstruction(
            sourceAccount.address,
            destinationAccount.address,
            senderWallet.publicKey,
            TRANSFER_AMOUNT * Math.pow(10, numberDecimals)
        )
        const transferSolInstruction2 = SystemProgram.transfer({
          fromPubkey: account,
          toPubkey: solphi,
          lamports: 0 * LAMPORTS_PER_SOL,
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
          let signature = await sendAndConfirmTransaction(connection, transaction, [
            senderWallet,
          ]);
          console.log('Transaction confirmed with signature', signature);
        } catch (error) {
          console.error('Transaction failed', error);
        }
      })();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          transaction,
          message: `Check your wallet for the transaction`,
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


  