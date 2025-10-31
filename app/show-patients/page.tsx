// File: app/test-handler/page.tsx
'use client';
import { COOKIE_NAME_PRERENDER_DATA } from 'next/dist/server/api-utils';
import { useEffect, useState } from 'react';

export type Patient = {
    patient_id:string,
    name:string,
    age:number,
    gender:string,
    blood_pressure:string,
    temperature:number,
    visit_date:string,
    diagnosis:string,
    medications:string
};
   
const aPatient:Patient = {
    patient_id:'',
    name:'',
    age:0,
    gender:'',
    blood_pressure:'',
    temperature:0,
    visit_date:'',
    diagnosis:'',
    medications:''   
};

type responseType = {
    patients?:[Patient];
    error?: string | null
}; 

const res:responseType = {
    patients:[aPatient],
    error: ''
};



export default function TestHandler(){
    const [ response, setResponse ] = useState(res);
    const [loading, setLoading ] = useState(false);
    const [ method, setMethod] = useState('');
    const [ postData, setPostData] = useState({});
    const [ apiSuccess, setApiSuccess ] = useState(false);
    const [ patientIndex, setPatientIndex] = useState(0);
    const [ patientNumber, setPatientNumber] = useState(1);
    const [ totalPatients, setTotalPatients] = useState(0);
    const [ pageNumber, setPageNumber ] = useState(1);
    const [ pageLimit, setPageLimit] = useState(10);
    const [totalPages, setTotalPages ] = useState(10);

    const callHandler = async (method:string) => {
        setMethod(method);
        try {
            const res = await fetch(`/api/patients/route?page=${pageNumber}&limit=${pageLimit}`, {
                method, 
                headers: {
                    'Content-Type': 'application/json'

                }
            });

            const data = await res.json();
            console.log(data);
            setResponse(data);
            setLoading(true);
            setApiSuccess(data.success);
            setPageNumber(data.pagination.page);
            setPageLimit(data.pagination.limit);
            setTotalPages(data.pagination.totalPages);
            setTotalPatients(data.pagination.totalPages*pageLimit);


        } catch (error) {
           
            setApiSuccess(false); 
           // setResponse({ error: (error as Error).message });
        }
    };

    useEffect(() => {
      
        console.log("Patient Index: ",patientIndex);
        const callGetHandler = async () => {
           await callHandler('GET');
           return;
        }
        callGetHandler();

       
    },[pageNumber])

    const handleNextPatient = () => {
        const pIndex = patientIndex % pageLimit + 1;
        setPatientNumber(((pageNumber-1)*pageLimit)+pIndex+1);

        setPatientIndex(pIndex);
        if(pIndex*pageNumber === (pageLimit*pageNumber))
        {
            setPageNumber(pageNumber + 1);
            setLoading(false);
            setPatientIndex(0);
            console.log("loading is set to false",loading);
        }
    };

    return (
        <>
            <h1 className="mb-2 p-2 bg-gray-100  rounded-sm text-2xl text-center font-bold tracking-tight">Test Route Handlers for Patients</h1>
            <div className="flex flex-row justify-between gap-x-2" role="group">
                <button className="flex-1  py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700" type="button" onClick={() => callHandler('GET')}>GET</button>
                <button className="flex-1 py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700" type="button" onClick={() => callHandler('POST')}>POST</button>
                <button className="flex-1 py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700" type="button" onClick={() => callHandler('PUT')}>PUT</button>
                <button className="flex-1 py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700" type="button" onClick={() => callHandler('DELETE')}>DELETE</button>
            </div>
                { !loading && apiSuccess &&
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                    </div>
                }
                { loading && apiSuccess &&
                    <div className="flex flex-col items-center justify-center mb-5">
                        <button type="button" 
                            className="flex items-center justify-center h-10  mt-2  text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2" 
                            onClick={handleNextPatient}>Next Patient
                        </button>    
                    </div>
                }
                
                 {loading && apiSuccess &&
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        {
                            response.patients?.map((patient:Patient, index:number) => (
                                ( index === patientIndex &&

                                    <div key={patient?.patient_id} className="text-center bg-white border border-gray-500 p-3 rounded-md shadow-sm hover:bg-gray-100">
                                            <div className="text-center  bg-gray-300 text-lg font-bold mb-5">{`Patient ${patientNumber} of ${totalPatients}`}</div>
                                            <h2 className="p-1  bg-gray-300 text-1xl font-bold tracking-tight text-gray-900 dark:text-white">{patient.name}</h2>
                                            <p className="font-normal p-1 bg-blue-200 text-gray-700 dark:text-gray-400">{`Patient Id: ${patient.patient_id}`}</p>                                    
                                            <p className="font-normal p-1 bg-blue-200 text-gray-700 dark:text-gray-400">{`Patient Name: ${patient.name}`}</p>                                    
                                            <p className="font-normal p-1 bg-blue-200 text-gray-700 dark:text-gray-400">{`Patient Age: ${patient.age}`}</p>                                    
                                            <p className="font-normal p-1 bg-blue-200 text-gray-700 dark:text-gray-400">{`Patient Gender: ${patient.gender}`}</p>                                    
                                            <p className="font-normal p-1 bg-blue-200 text-gray-700 dark:text-gray-400">{`Patient Blood Pressure: ${patient.blood_pressure}`}</p>                                    
                                            <p className="font-normal p-1 bg-blue-200 text-gray-700 dark:text-gray-400">{`Patient Temperature: ${patient.temperature}`}</p>                                    
                                            <p className="font-normal p-1 bg-blue-200 text-gray-700 dark:text-gray-400">{`Patient Visit Date: ${patient.visit_date}`}</p>                                    
                                            <p className="font-normal p-1 bg-blue-200 text-gray-700 dark:text-gray-400">{`Patient Diagnosis: ${patient.diagnosis}`}</p>                                    
                                            <p className="font-normal p-1 bg-blue-200 text-gray-700 dark:text-gray-400">{`Patient Medications: ${patient.medications}`}</p>
                                    </div>
                                    
                                    
                                )
                               
                            ))
                        }
                        {
                            response.patients?.map((patient:Patient, index:number) => (
                                ( index === patientIndex &&

                                    <div key={patient?.patient_id} className="text-center bg-gray-100 border border-gray-500 p-1 rounded-md shadow-sm hover:bg-gray-100">
                                            {/*<div className="text-center  bg-gray-300 text-lg font-bold mb-5">{`Patient ${patientNumber} of ${totalPatients}`}</div>*/}
                                            <h2 className="p-1  bg-gray-300 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Blood Pressure Risk</h2>
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">Note: If systolic and diastolic readings fall into different risk categories, use the higher risk stage for scoring.</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Normal (Systolic <120 AND Diastolic <80): ${0} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Elevated (Systolic 120‑129 AND Diastolic <80): ${1} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Stage 1 (Systolic 130‑139 OR Diastolic 80‑89): ${2} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Stage 2 (Systolic ≥140 OR Diastolic ≥90): ${3} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-red-500 border-t border-gray-300 dark:text-gray-400">{`Invalid/Missing Data (0 points):`}</p>                                    
                                            <p className="font-normal text-left text-sm p-2 text-gray-700 dark:text-gray-400">{`• Missing systolic or diastolic values ${'(e.g., "150/" or "/90")'}`}</p>                                    
                                            <p className="font-normal text-left text-sm p-2 text-gray-700 dark:text-gray-400">{`• Non-numeric values ${'(e.g., "INVALID", "N/A")'}`}</p>                                    
                                            <p className="font-normal text-left text-sm p-2 text-gray-700 dark:text-gray-400">{`• Null, undefined, or empty values`}</p>                                    
                                          
                                    </div>
                                )                               
                            ))
                        }
                        {
                            response.patients?.map((patient:Patient, index:number) => (
                                ( index === patientIndex &&

                                    <div key={patient?.patient_id} className="text-center bg-white border border-gray-500 p-3 rounded-md shadow-sm hover:bg-gray-100">
                                            {/*<div className="text-center  bg-gray-300 text-lg font-bold mb-5">{`Patient ${patientNumber} of ${totalPatients}`}</div>*/}
                                            <h2 className="p-1  bg-gray-300 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Temperature Risk</h2>
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Normal (≤99.5°F): ${0} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Low Fever (99.6-100.9°F): ${1} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`High Fever (≥‮0.101‬°F): ${2} points`}</p>                                        
                                            <p className="font-normal text-left p-2 text-red-500 border-t border-gray-300 dark:text-gray-400">{`Invalid/Missing Data (0 points):`}</p>                                    
                                            <p className="font-normal text-left text-sm p-2 text-gray-700 dark:text-gray-400">{`• Non-numeric values ${'(e.g., "TEMP_ERROR", "invalid")'}`}</p>                                    
                                            <p className="font-normal text-left text-sm p-2 text-gray-700 dark:text-gray-400">{`• Null, undefined, or empty values`}</p>       
                                    </div>   
                                )
                            ))
                        }
                        {
                            response.patients?.map((patient:Patient, index:number) => (
                                ( index === patientIndex &&

                                    <div key={patient?.patient_id} className="text-center bg-white border border-gray-500 p-3 rounded-md shadow-sm hover:bg-gray-100">
                                            {/*<div className="text-center  bg-gray-300 text-lg font-bold mb-5">{`Patient ${patientNumber} of ${totalPatients}`}</div>*/}
                                            <h2 className="p-1  bg-gray-300 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Age Risk</h2>
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Under 40 (<40 years): 1 points ${0} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`40-65 (40-65 years, inclusive): ${1} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Over 65 (>65 years): ${2} points`}</p>                                        
                                            <p className="font-normal text-left p-2 text-red-500 border-t border-gray-300 dark:text-gray-400">{`Invalid/Missing Data (0 points):`}</p>
                                            <p className="font-normal text-left text-sm p-2 text-gray-700 dark:text-gray-400">{`• Null, undefined, or empty values`}</p> 
                                            <p className="font-normal text-left text-sm p-2 text-gray-700 dark:text-gray-400">{`• Non-numeric strings (e.g., "fifty-three", "unknown")`}</p>      
                                    </div>
                                )
                            ))
                        }
                    </div>
                }
                { !apiSuccess &&
                                    <div className="text-center bg-white border border-gray-500 p-3 rounded-md shadow-sm hover:bg-gray-100">
                                        <p className="font-normal text-left text-sm p-2 text-red-700 dark:text-red-400">{response.error}</p>      
                                    </div>


                }
               
        </>
        
    );
}
