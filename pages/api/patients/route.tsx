

import { NextApiRequest, NextApiResponse } from "next";
import { Patient } from "@/app/show-patients/page";

/*
 class CustomError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = "CustomError";
  }
}
*/

function delayRetry(delay:number){
    return new Promise((resolve) => setTimeout(resolve, delay));
}


const tries = 3;
let retryMethod:string = '';
export default async function handlerWithRetry(req:NextApiRequest, res?:NextApiResponse) {
    const {method} = req;
    retryMethod = method || 'GET';

    const limit = req.query.limit;
    const page = req.query.page;

    switch (method) {
        case 'GET':
            
           
            const myHeaders = new Headers();
            myHeaders.append( 'x-api-key', process.env.API_KEY as string);
            try {
                    const getPatients = async () => {
                        const response = await fetch(`https://assessment.ksensetech.com/api/patients?page=${page}&limit=${limit}`,
                            {
                                method:'GET',
                                headers: myHeaders
                            }
                        );

                        if (!response.ok) {
                            // Attempt to parse error details from the response body if it's JSON
                            // If the response is not OK, it might still contain JSON with error details.
                            // Attempt to parse it, but also handle cases where it's not valid JSON.
                          
                                const errorData = await response.json();
                                // Provide Http Error response for !response.ok
                                if (response.status === 502){
                                    // Handle the specific 502 Bad Gateway error
                                    console.error('502 Bad Gateway error:',errorData);
                                    return res?.status(502).json({
                                        success: false,
                                        error:`502 Bad Gateway error: ${response.status}, Details: ${JSON.stringify(errorData)}`
                                    });

                                }
                                if (response.status === 404) {
                                    return res?.status(404).json({
                                        success: false,
                                        error: `Rate limiting: May return 429 errors if you make requests too quickly. Consider caching data to prevent unnecessary repeated requests`
                                    });
                                
                                } else if (response.status === 500 || response.status === 503) {
                                        let cnt = tries
                                        while(cnt > 0) {
                                            cnt--;
                                            if(cnt === 0){
                                                return res?.status(500).json({ 
                                                    success: false,
                                                    error:`500 Internal Server Error and/or Non-availability: Request tried ${tries} times and could not be fullfilled due to server configuration, maintenance, or other issue. This is not due to the client request. This may be temporary so try again later:`,
                                                });
                                            }
                                            delayRetry(3000);
                                            handlerWithRetry({...req, method: retryMethod} as NextApiRequest);
                                        }
                                }
                           
                                else {
                                    // Handle other non-successfull responses (e.g, 400, 404,500)
                                    console.error(`API error!, status ${response.status}`, errorData);
                                    return res?.status(response.status).json({
                                        success: false,
                                        error: `API error! Status: ${response.status}, Details: ${JSON.stringify(errorData)}`
                                    });
                                }
                           
                        }
                        // Return Fetched Response
                        return await response.json();
                    
                    }

                    // check for missing fields
                    const patients = await getPatients();
                    if(patients.data?.length > 0) {
                        const missing_fields:Array<{message:string,key:string}> = [{message:'',key:''}];
                        patients.data?.map((patient:Patient) => {
                            const keys: Array<keyof Patient> = Object.keys(patient) as Array<keyof Patient>;
                            
                            keys.forEach(key => {
                                    if(patient[key] === undefined || patient[key] === null ){
                                        missing_fields.push({message:`Patient ${patient.name} and Id: ${patient.patient_id} is missing field ${key}`, key:key});
                                    }
                                    else{
                                        missing_fields.push({message:`Patient ${patient.name} and Id: ${patient.patient_id} has field ${key}`,key:key});
                                    }

                                });
                            });
                            
                    
                        const missing_info = missing_fields.filter(field => field.message.includes('missing'));
                     

                        res?.status(200).json({ // Return API response and processed data
                            success:true,
                            message: 'Fetching patient data', 
                            patients:patients.data,                                     
                            missing_info:missing_info,
                            metadata:patients.metadata,
                            pagination:patients.pagination 
                        });
                    } else {  // data returned null, try getPatients again
                           let cnt = tries;
                           while(cnt > 0) {
                                cnt--;
                                if(cnt === 0){  // Give Http response after tries exhausted
                                    return res?.status(405).json({
                                        success: false,
                                        error: `Repeated (${tries} times) tried to Retrieve Data with null results`
                                    });
                                }
                                delayRetry(3000);
                                handlerWithRetry({...req, method: retryMethod} as NextApiRequest);
                            }
                        }
           
           
         
            }catch (error) {
            // This catch block handles network errors or exceptions during the fetch call
                console.error('Fetch operation failed:', error instanceof Error ? error.message : String(error));
                return { success: false, message: 'A network error occurred. Please try again.' };
            }
            break;
    

        
        case 'POST':
            res?.status(201).json({ message: `Creating a new user: ${req.body.name}`});
            console.log(req.body);
            break;
        case 'PUT':
            res?.status(200).json({ message: `Updating user data for: ${req.body.name}` });
            break;
        case 'DELETE':
            res?.status(200).json({ message: 'Deleting user data' });
            break;
        default:
            res?.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            res?.status(405).end(`Method ${method} Not Allowed`);
    }
}
