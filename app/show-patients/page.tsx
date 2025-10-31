// File: app/test-handler/page.tsx
'use client';
import { minify } from 'next/dist/build/swc/generated-native';
import { COOKIE_NAME_PRERENDER_DATA } from 'next/dist/server/api-utils';
import { useEffect, useState, useCallback } from 'react';

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

export type EvalPatient = Patient & {
    blood_pressure_risk?:number,
    temperature_risk?:number,
    age_risk?:number,
    total_risk_score?:number
}
   
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
    const [ infoError, setInfoError] = useState('');
    const [ systolic, setSystolic ] = useState(0);
    const [ diastolic, setDiastolic ] = useState(0);
    const [ patients, setPatients] = useState([]);
    const [ pageNumber, setPageNumber ] = useState(1);
    const [ pageLimit, setPageLimit] = useState(10);
    const [totalPages, setTotalPages ] = useState(10);
    const [ bloodPressureRisk, setBloodPressureRisk] = useState<null | number>(null);
    const [ evaluatedPatients, setEvaluatedPatients ] = useState<EvalPatient[]>([])
   

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
            setPatients(data.patients);
            setLoading(true);
            setInfoError('');
            setApiSuccess(true);
            setPageNumber(data.pagination.page);
            setPageLimit(data.pagination.limit);
            setTotalPatients(data.pagination.total);
          
        } catch (error) {
           
            setApiSuccess(false); 
            console.log("Patients: ",patients);
           // setResponse({ error: (error as Error).message });
        }
    };

    useEffect(() => {      
        console.log("Patient Index: ",patientIndex);
        console.log('Evaluated Patients:',evaluatedPatients );
        const callGetHandler = async () => {
           await callHandler('GET');
           return;
        };       
        if(apiSuccess){            
            callGetHandler();
           
        }
    },[pageNumber,apiSuccess]);

    type pressureTypes = null | undefined | '';

    useEffect(() => {
        let thePatient:Patient;
        if(patients?.length > 0){
            const patient:Patient = patients[patientIndex as number];
            thePatient= patient;
            console.log("Current Patient: ", patient); 
            try {
                const pressure = patient.blood_pressure.split("/");
                if( pressure === undefined )  // Throw Error for no values
                    throw new TypeError(`Blood Pressure values (systolic and diastolic) are missing.`);

                // Check values for null, undefined, or empty and throw Error
                console.log("Pressure:", pressure);
                const systolic = pressure[0];
                const diastolic = pressure[1];
                if( 
                    (systolic === null || diastolic === null) ||
                    (systolic === undefined || diastolic === undefined) ||
                    (systolic === '' || diastolic === '')
                   )
                    throw new TypeError(`Blood Pressure Input values are null, undefined, or empty! ${JSON.stringify(pressure)}`);

                // Check if values are convertible to Numbers and throw error
                if(isNaN(Number(systolic)) || isNaN(Number(diastolic)))
                    throw new TypeError(`Blood Pressure Input is not convertable to a number! ${JSON.stringify(pressure)}`);
           
                // Set State variables
                const systolic_number = Number(pressure[0]);
                const diastolic_number = Number(pressure[1]);
                setSystolic(systolic_number);
                setDiastolic(diastolic_number);

                let normalPoints = 0;
                let elevatedPoints = 0;
                let stage1Points = 0;
                let stage2Points = 0;
                if(systolic_number < 120 && diastolic_number < 0)
                    normalPoints = 0;
                else if((systolic_number >= 120 && systolic_number <= 129) && diastolic_number < 80)
                    elevatedPoints = 1;
                else if((systolic_number >= 130 && systolic_number <= 139) || (diastolic_number >= 80 && diastolic_number <= 89))
                    stage1Points = 2;
                else if(systolic_number >= 140 || diastolic_number >= 90)
                    stage2Points = 2;
                const blood_pressure_risk = normalPoints + elevatedPoints + stage1Points + stage2Points;     

                setBloodPressureRisk(blood_pressure_risk);
                const eval_patient:EvalPatient = {
                    patient_id: patient.patient_id,
                    name: patient.name,
                    age: patient.age,
                    gender: patient.gender,
                    blood_pressure: patient.blood_pressure,
                    temperature: patient.temperature,
                    visit_date: patient.visit_date,
                    diagnosis: patient.diagnosis,
                    medications: patient.medications,
                    blood_pressure_risk: blood_pressure_risk,
                    temperature_risk: 0,
                    age_risk: 0,
                    total_risk_score: blood_pressure_risk
                }
               
                setEvaluatedPatients(prevItems => [...prevItems, eval_patient]);





            } catch (error ) {
                //console.error(`An error occurred:", ${(error as Error).message}`)
                setInfoError(`An error occurred:", ${(error as Error).message} Patient: ${JSON.stringify(thePatient)} `);
            }






        }
    },[patients, patientIndex])

 
   

     const handleNextPatient = useCallback(() => {
                const pIndex = patientIndex as number % pageLimit + 1;
                const patient_number = ((pageNumber-1)*pageLimit)+pIndex+1;
                setPatientNumber(patient_number);
                setInfoError('');
                console.log("Patient Number: ", patient_number);
                setPatientIndex(pIndex);
                if(pIndex*pageNumber === (pageLimit*pageNumber))
                {
                    setPageNumber(pageNumber + 1);
                    setLoading(false);
                    setPatientIndex(0);
                    console.log("loading is set to false",loading);
                }
            },[patientIndex]);

    const handlePreviousPatient = () => {
        const pIndex = patientIndex as number % pageLimit;
        const patient_number = ((pageNumber-1)*pageLimit)+pIndex;
        console.log("Patient Number: ", patient_number);
        const patients_lastPage = (pageNumber-1)*pageLimit;
        setPatientNumber(patient_number);
        setInfoError('');
        setPatientIndex(pIndex-1);
        if(patient_number === patients_lastPage)
        {          
            setPageNumber(pageNumber-1);
            setPatientNumber(patient_number);
            
            setPatientIndex(9);
            console.log("loading is set to false",loading);
        }
    };

    const handleRetry = () => {
         setApiSuccess(true); 
    };

    return (
        <>
            { true && 
                <div>
                    <h1 className="mb-2 p-2 bg-gray-100  rounded-sm text-2xl text-center font-bold tracking-tight">Patients Risk Scoring</h1>
                </div>
            }
          
                { !loading && apiSuccess &&
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                    </div>
                }

                
                { loading && apiSuccess &&
                    <div className="flex items-center justify-center">
                        { patientNumber > 1 &&
                            <button type="button" 
                                className="flex items-center justify-center h-10  mt-2  text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2" 
                                onClick={handlePreviousPatient}>Previous Patient
                            </button>   
                        } 
                        { patientNumber < totalPatients &&
                             <button type="button" 
                                className="flex items-center justify-center h-10  mt-2  text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2" 
                                onClick={handleNextPatient}>Next Patient
                            </button>  
                        }
                         
                    </div>
                }
                

                 {loading && apiSuccess &&
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        {
                            patients?.map((patient:Patient, index:number) => (
                                ( index === patientIndex as number &&

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
                                            { bloodPressureRisk !== null &&
                                                <p className="font-normal text-left p-2 text-blue-500 border-t border-gray-300 dark:text-gray-400">{`The Blood Pressure Risk for ${patient.name} is ${bloodPressureRisk}.`}</p>                                    
                                                
                                            }   
                                             { bloodPressureRisk !== null && bloodPressureRisk >= 4 &&
                                                <p className="font-normal text-left p-2 text-blue-500 border-t border-gray-300 dark:text-gray-400">{`The Blood Pressure Risk for ${patient.name} is ${bloodPressureRisk}.`}</p>                                    
                                                
                                            }                                      
                                            <p className="font-normal text-left p-2 text-red-500 border-t border-gray-300 dark:text-gray-400">{`Invalid/Missing Data (0 points):`}</p>  
                                           
                                            { infoError === '' &&
                                            <div>
                                                <p className="font-normal text-left text-sm p-2 text-gray-700 dark:text-gray-400">{`• Missing systolic or diastolic values ${'(e.g., "150/" or "/90")'}`}</p>                                    
                                                <p className="font-normal text-left text-sm p-2 text-gray-700 dark:text-gray-400">{`• Non-numeric values ${'(e.g., "INVALID", "N/A")'}`}</p>                                    
                                                <p className="font-normal text-left text-sm p-2 text-gray-700 dark:text-gray-400">{`• Null, undefined, or empty values`}</p>  
                                            </div>
                                            }
                                            { infoError !== '' &&
                                                <p className="font-normal overflow-y-auto  text-left text-sm p-6 text-red-500 dark:text-gray-400">{infoError}</p>
                                            }                                  
                                          
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
                                         <button type="button" 
                                            className="flex items-center justify-center h-10  mt-2  text-white bg-red-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2" 
                                            onClick={handleRetry}>Retry
                                        </button>        
                                    </div>


                }
                
               
        </>
        
    );
}
