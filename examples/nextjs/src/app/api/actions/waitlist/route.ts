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
    SystemProgram,
    Transaction,
  } from '@solana/web3.js';

  const { createMemoInstruction } = require('@solana/spl-memo');
  const headers = createActionHeaders();
  
  export const GET = async (req: Request) => {
    try {
      const requestUrl = new URL(req.url);
  
      const baseHref = new URL(
        `/api/actions/waitlist?`,
        requestUrl.origin,
      ).toString();
      const payload: ActionGetResponse = {
        type: 'action',
        title: 'Join the Waitlist of SolΦ',
        icon: 'https://i.ibb.co/GnsWmZZ/Ekran-G-r-nt-s-2024-10-03-23-41-35.png',
        description:
          'Enter your mail to join the waitlist.',
        label: 'Transfer', // this value will be ignored since `links.actions` exists
        links: {
          actions: [
            {
              label: 'Send', // button text
              href: `${baseHref}mail={mail}`, // this href will have a text input
              parameters: [
                {
                  name: 'mail', // parameter name in the `href` above
                  label: 'Your Mail Address', // placeholder of the text input
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
      const { mail, toPubkey } = validatedQueryParams(requestUrl);
      const body: ActionPostRequest = await req.json();
  
      // validate the client provided input
      let account: PublicKey;
      try {
        account = new PublicKey(body.account);
      } catch (err) {
        return new Response('Invalid "account" provided', {
          status: 400,
          headers,
        });
      }
  
      const connection = new Connection(
        process.env.SOLANA_RPC! || clusterApiUrl('mainnet-beta'),
      );
    //   const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      
  
      // ensure the receiving account will be rent exempt
      const minimumBalance = await connection.getMinimumBalanceForRentExemption(
        0, // note: simple accounts that just store native SOL have `0` bytes of data
      );
      if (0.001 * LAMPORTS_PER_SOL < minimumBalance) {
        throw `account may not be rent exempt: ${toPubkey.toBase58()}`;
      }
      // create an instruction to transfer native SOL from one wallet to another
      const transferSolInstruction = SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: toPubkey,
        lamports: 0 * LAMPORTS_PER_SOL,
      });

      const cMI = createMemoInstruction(`${mail}`, [account])
  
      // get the latest blockhash amd block height
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
  
      // create a legacy transaction
      const transaction = new Transaction({
        feePayer: account,
        blockhash,
        lastValidBlockHeight,
      }).add(transferSolInstruction,cMI);
  
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
          transaction,
          message: `You have successfully joined the waitlist of SolΦ`,
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
      '6wbNVswVdbSAakfojVxY5DRLh3J5simMSajU2aoC4JUP',
    );
    let mail: string = "abc";
  
    // try {
    //   if (requestUrl.searchParams.get('wallet')) {
    //     toPubkey = new PublicKey(requestUrl.searchParams.get('wallet')!);
    //   }
    // } catch (err) {
    //   throw 'Invalid input query parameter: wallet';
    // }
  
    try {
      if (requestUrl.searchParams.get('mail')) {
        mail = requestUrl.searchParams.get('mail')!;
      }
  
      if (mail.length <= 0) throw 'mail is invalid';
    } catch (err) {
      throw 'Invalid input query parameter: mail';
    }
  
    return {
      mail,
      toPubkey,
    };
  }
  