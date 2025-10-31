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
    const [ patientIndex, setPatientIndex] = useState(0)
    const [ pageNumber, setPageNumber ] = useState(1);
    const [ pageLimit, setPageLimit] = useState(10);


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
            setPageNumber(data.pagination.page);
            setPageLimit(data.pagination.limit);

        } catch (error) {
            setResponse({ error: (error as Error).message });
        }
    };

    useEffect(() => {
        console.log("Patient Index: ",patientIndex);
        callHandler('GET');
    },[pageNumber])

    const handleNextPatient = () => {
        const pIndex = patientIndex % pageLimit + 1;

        setPatientIndex(pIndex);
        if(pIndex*pageNumber === (pageLimit*pageNumber))
        {
            setPageNumber(pageNumber + 1);
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
                 { !loading && 
                    <div className="flex items-center justify-center h-screen">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                    </div>
                 }
                 {loading && method === 'GET' &&
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2" >
                        {
                            response.patients?.map((patient:Patient, index:number) => (
                                ( index === patientIndex &&

                                <div key={patient?.patient_id} 
                                    className="text-center bg-white border border-gray-500 p-3 rounded-md shadow-sm hover:bg-gray-100" 
                                 >
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
                    </div>
                }
                <button type="button" className="mt-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" onClick={handleNextPatient}>Next Patient</button>
    
        </>
        
    );
}
