

import { NextApiRequest, NextApiResponse } from "next";
import { Patient } from "@/app/show-patients/page";

 class CustomError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = "CustomError";
  }
}


export default async function handler(req:NextApiRequest, res:NextApiResponse) {
    const {method} = req;

    switch (method) {
        case 'GET':
            
            console.log("In Patients route");
            const page = 1;
            const limit = 10;
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
                    try {
                        const errorData = await response.json();
                        throw new Error(`HTTP error! Status: ${response.status}, Details: ${JSON.stringify(errorData)}`);
                    } catch (jsonError) {
                        // If parsing the error body as JSON fails, throw a generic error.
                        throw new Error(`HTTP error! Status: ${response.status}, Could not parse error details.`);
                    }
                }
                return await response.json();
             
            }

            // check for missing fields
            const patients = await getPatients();
            //console.log("Patients:", patients.data);

            const missing_fields:string[] = [];
            patients.data.map((patient:Patient) => {
                //const keys = Object.keys(patient);
                const keys: Array<keyof Patient> = Object.keys(patient) as Array<keyof Patient>;
                //console.log("keys:", keys);
                //console.log("Patient: ", patient);
                
                keys.forEach(key => {
                        const value:any = patient[key];
                        if(patient[key] === undefined || patient[key] === null ){
                            missing_fields.push(`Patient ${patient.name} and Id: ${patient.patient_id} is missing field ${key}`);
                        }
                        else{
                            missing_fields.push(`Patient ${patient.name} and Id: ${patient.patient_id} has field ${key}`);
                        }

                    });
                });
                
            console.log("Missing Fields:", missing_fields);

            const missing_info = missing_fields.filter(field => field.includes('missing'));
            console.log("Missing Info:", missing_info);

            

           
            res.status(200).json({ message: 'Fetching patient data', patients:patients.data, missing_info:missing_info });
            }catch (error: unknown){
                if (error === 404) {
                    console.error("Rate limiting: May return 429 errors if you make requests too quickly. Consider caching data to prevent unnecessary repeated requests.");
                   
                } else if (error === 500 || error === 503) {
                    console.error("500 Internal Server Error and/or Non-availability: Request could not be fullfilled due to server configuration, maintenance, or other issue. This is not due to the client request. This may be temporary so try again later.",error);
                  
                }
                else {
                    console.error("An unexpected error occurred:", error);
                } 
            }
            break;
    

        
        case 'POST':
            res.status(201).json({ message: `Creating a new user: ${req.body.name}`});
            console.log(req.body);
            break;
        case 'PUT':
            res.status(200).json({ message: `Updating user data for: ${req.body.name}` });
            break;
        case 'DELETE':
            res.status(200).json({ message: 'Deleting user data' });
            break;
        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}
