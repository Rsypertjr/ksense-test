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

let thePatient:Patient;
let theEvalPatient:EvalPatient;
let blood_pressure_risk:number;
let temperature_risk:number;
let eval_patient:EvalPatient;

export default function TestHandler(){
    const [ response, setResponse ] = useState(res);
    const [loading, setLoading ] = useState(false);
    const [ method, setMethod] = useState('');
    const [ postData, setPostData] = useState({});
    const [ apiSuccess, setApiSuccess ] = useState(true);
    const [ readyToSubmit, setReadyToSubmit] = useState(false);
    const [ notYet, setNotYet ] = useState(false);
    const [ patientIndex, setPatientIndex] = useState(0);
    const [ patientNumber, setPatientNumber] = useState(1);
    const [ totalPatients, setTotalPatients] = useState(0);
    const [ infoBpError, setBpInfoError] = useState('');
    
    const [ infoTpError, setTpInfoError] = useState('');
    
    const [ infoAgeError, setAgeInfoError] = useState('');
    const [ temperature, setTemperature ] = useState(0);
    const [ age, setAge ] = useState(0);
    const [ patients, setPatients] = useState([]);
    const [ pageNumber, setPageNumber ] = useState(1);
    const [ pageLimit, setPageLimit] = useState(10);
    const [ bloodPressureRisk, setBloodPressureRisk] = useState<null | number>(null);    
    const [ temperatureRisk, setTemperatureRisk] = useState<null | number>(null);
    const [ totalRisk, setTotalRisk] = useState<null | number>(null);
    const [ ageRisk, setAgeRisk] = useState<null | number>(null);
    const [ evaluatedPatients, setEvaluatedPatients ] = useState<EvalPatient[] | undefined>([]);
    const [ highRiskPatients, setHighRiskPatients ] = useState<string[] | undefined>([]);
    const [ feverPatients, setFeverPatients ] = useState<string[] | undefined>([]);
    const [ dataQualityIssues, setDataQualityIssues ] = useState<string[] | undefined>([]);
    
   
   

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
            setBpInfoError('');
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

    useEffect(() => {
        console.log("Evaluated Patients: ",evaluatedPatients);
        const number_evaluated = evaluatedPatients?.length;
        console.log("Number Evaluated: ",number_evaluated);

        if((number_evaluated === totalPatients) && (patientNumber == totalPatients)){
            console.log("High Risk Patients: ", highRiskPatients);
            console.log("Fever Patients: ", feverPatients );
            console.log("Data Quality Issues: ", dataQualityIssues);
            setReadyToSubmit(true);
            setNotYet(false);
            

        }

    },[evaluatedPatients])

     useEffect(() => {
        console.log("High Risk Patients: ",highRiskPatients);
        console.log("Fever Patients: ",feverPatients);
        console.log("Data Quality Issues: ", dataQualityIssues);
      

    },[highRiskPatients,feverPatients,dataQualityIssues])

    type pressureTypes = null | undefined | '';

    useEffect(() => {
       
        if(patients?.length > 0){
            const patient:Patient = patients[patientIndex as number];
            thePatient = patient;
            console.log("Current Patient: ", patient); 
            
          
            // Evaluate for Blood Pressure Risk
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
                else;
                let blood_pressure_risk = normalPoints + elevatedPoints + stage1Points + stage2Points;     

                setBloodPressureRisk(blood_pressure_risk);
                eval_patient = {
                    patient_id: thePatient.patient_id,
                    name: thePatient.name,
                    age: thePatient.age,
                    gender: thePatient.gender,
                    blood_pressure: thePatient.blood_pressure,
                    temperature: thePatient.temperature,
                    visit_date: thePatient.visit_date,
                    diagnosis: thePatient.diagnosis,
                    medications: thePatient.medications,
                    blood_pressure_risk: blood_pressure_risk,
                    temperature_risk: 0,
                    age_risk: 0,
                    total_risk_score: 0
                }
                console.log("Evaluated Patient: ", eval_patient);
                setEvaluatedPatients((prevItems) => [...(prevItems || []), eval_patient]);
            } catch (error ) {
                //console.error(`An error occurred:", ${(error as Error).message}`)
                setBpInfoError(`An error occurred:", ${(error as Error).message} Patient: ${JSON.stringify(patient)} `);


                eval_patient = {
                    patient_id: patient?.patient_id,
                    name: patient?.name,
                    age: patient?.age,
                    gender: patient?.gender,
                    blood_pressure: patient?.blood_pressure,
                    temperature: patient?.temperature,
                    visit_date: patient?.visit_date,
                    diagnosis: patient?.diagnosis,
                    medications: patient?.medications,
                    blood_pressure_risk: 0,
                    temperature_risk: 0,
                    age_risk: 0,
                    total_risk_score: 0
                }
                setEvaluatedPatients((prevItems) => [...(prevItems || []), eval_patient]); 
                // Record Data Quality Issues               
                const checkAlready = dataQualityIssues?.filter((id) => {
                    return patient?.patient_id === id;
                })
                if(checkAlready?.length === 0)
                    setDataQualityIssues((prevItems) => [...prevItems || [], patient?.patient_id]);           
            }

            // Evaluate for Temperature Risk
            try {
                const temperature = patient.temperature;
                if( temperature === undefined )  // Throw Error for no values
                    throw new TypeError(`Temperature Value is missing.`);

                // Check values for null, undefined, or empty and throw Error
                console.log("Temperature:", temperature);
                if( temperature === null )
                    throw new TypeError(`Temperature is null, undefined, or empty! ${JSON.stringify(temperature)}`);

                // Check if values are convertible to Numbers and throw error
                if(isNaN(Number(temperature)))
                    throw new TypeError(`Temperature Input is not convertable to a number! ${JSON.stringify(temperature)}`);
           
                // Set State variables
                const temperature_number = Number(temperature);
                setTemperature(temperature_number);

                let normalPoints = 0;
                let lowFeverPoints = 0;
                let highFeverPoints = 0;
                let stage2Points = 0;
                if(temperature_number <= 99.5)
                    normalPoints = 0;
                else if(temperature_number >= 99 && temperature_number <= 100.9)
                    lowFeverPoints = 1;
                else if(temperature_number >= 101.0)
                    highFeverPoints = 2;
                else;
                let temperature_risk = normalPoints + lowFeverPoints + highFeverPoints;     

                setTemperatureRisk(temperature_risk);

                // Start updating evaluated patient without Errors
                const partialUpdate: Partial<EvalPatient> = {                   
                    temperature_risk: temperature_risk,
                }
                eval_patient = {...eval_patient, ...partialUpdate}

               const non_evaluated = evaluatedPatients?.filter((patient) => {
                  return patient.patient_id !== eval_patient.patient_id;

               });

                // Record High Temperature
                    const checkAlready = feverPatients?.filter((id) => {
                        return eval_patient.patient_id === id;
                    })
                    if(checkAlready?.length === 0)
                        if(Number(eval_patient.temperature) >= 99.6) {
                            setFeverPatients((prevItems) => [...prevItems || [], eval_patient.patient_id]);                   
                }

                

               const new_set = [...non_evaluated as EvalPatient[], eval_patient]
               console.log("New Set: ", new_set);
               setEvaluatedPatients(new_set);
            } catch (error ) {
                //console.error(`An error occurred:", ${(error as Error).message}`)
                setTpInfoError(`An error occurred:", ${(error as Error).message} Patient: ${JSON.stringify(patient)} `);

                // Add Evaluated Patient with Temperature Risk = 0 because of Error
                const partialUpdate: Partial<EvalPatient> = {                   
                    temperature_risk: 0,
                }
                eval_patient = {...eval_patient, ...partialUpdate}

                const non_evaluated = evaluatedPatients?.filter((patient) => {
                    return patient.patient_id !== eval_patient.patient_id;
                });
               const new_set = [...non_evaluated as EvalPatient[], eval_patient]
               console.log("New Set: ", new_set);
               setEvaluatedPatients(new_set);


                // Record High Temperature Even in Error
                    const checkAlready = feverPatients?.filter((id) => {
                        return eval_patient.patient_id === id;
                    })
                    if(checkAlready?.length === 0)
                        if(Number(eval_patient.temperature) >= 99.6) {
                            setFeverPatients((prevItems) => [...prevItems || [], eval_patient.patient_id]);                   
                }


                // Record Data Quality Issues               
                const checkAlreadyQ = dataQualityIssues?.filter((id) => {
                    return patient?.patient_id === id;
                })
                if(checkAlreadyQ?.length === 0)
                    setDataQualityIssues((prevItems) => [...prevItems || [], patient?.patient_id]);       
            }



            
            // Evaluate for Age Risk
            try {
                const age = patient.age;
                if( age === undefined )  // Throw Error for no values
                    throw new TypeError(`Age Value is missing.`);

                // Check values for null, undefined, or empty and throw Error
                console.log("Age:", age);
                if( temperature === null )
                    throw new TypeError(`Age is null, undefined, or empty! ${JSON.stringify(age)}`);

                // Check if values are convertible to Numbers and throw error
                if(isNaN(Number(age)))
                    throw new TypeError(`Age Input is not convertable to a number! ${JSON.stringify(age)}`);
           
                // Set State variables
                const age_number = Number(age);
                setAge(age_number);

                let normalPoints = 0;
                let lowRiskPoints = 0;
                let highRiskPoints = 0;
                let stage2Points = 0;
                if(age_number < 40)
                    normalPoints = 0;
                else if(age_number >= 40 && age_number <= 65)
                    lowRiskPoints = 1;
                else if(age_number > 65)
                    highRiskPoints = 2;
                else;
                let age_risk = normalPoints + lowRiskPoints + highRiskPoints;     

                setAgeRisk(age_risk);

                // Add Evaluated Patient with newly calculated age risk and total risk score
                const total_risk = (eval_patient.blood_pressure_risk as number) + (eval_patient.temperature_risk as number) + age_risk;
                const partialUpdate: Partial<EvalPatient> = {                   
                    age_risk: age_risk,
                    total_risk_score: total_risk
                }
                eval_patient = {...eval_patient, ...partialUpdate}
                setTotalRisk(total_risk);

                // Record High Risk
                if(total_risk >= 4) {
                    const checkAlready = highRiskPatients?.filter((id) => {
                        return eval_patient.patient_id === id;
                    })
                    if(checkAlready?.length === 0)
                        setHighRiskPatients((prevItems) => [...prevItems || [], eval_patient.patient_id]);
                }

                const non_evaluated = evaluatedPatients?.filter((patient) => {
                    return patient.patient_id !== eval_patient.patient_id;
                });

               const new_set = [...non_evaluated as EvalPatient[], eval_patient];
               console.log("New Set: ", new_set);
               setEvaluatedPatients(new_set);
            } catch (error ) {
                
                setAgeInfoError(`An error occurred:", ${(error as Error).message} Patient: ${JSON.stringify(patient)} `);

                // Calculate total risk with 0 age risk because of Error
                // Also, evaluate Patient still in Error with no age risk
                const total_risk = (eval_patient.blood_pressure_risk as number) + (eval_patient.temperature_risk as number) + 0;
                const partialUpdate: Partial<EvalPatient> = {                   
                    age_risk: 0,
                    total_risk_score: total_risk
                }
                eval_patient = {...eval_patient, ...partialUpdate}
                setTotalRisk(total_risk);

                const non_evaluated = evaluatedPatients?.filter((patient) => {
                    return patient.patient_id !== eval_patient.patient_id;
                });

               const new_set = [...non_evaluated as EvalPatient[], eval_patient];
               console.log("New Set: ", new_set);
               setEvaluatedPatients(new_set);

                // Record High Risk even in Error and no age risk
                if(total_risk >= 4) {
                    const checkAlready = highRiskPatients?.filter((id) => {
                        return eval_patient.patient_id === id;
                    })
                    if(checkAlready?.length === 0)
                        setHighRiskPatients((prevItems) => [...prevItems || [], eval_patient.patient_id]);
                }

                // Record Data Quality Issues               
                const checkAlready = dataQualityIssues?.filter((id) => {
                    return patient?.patient_id === id;
                })
                if(checkAlready?.length === 0)
                    setDataQualityIssues((prevItems) => [...prevItems || [], patient?.patient_id]);           
            }
        }
    },[patients, patientIndex])

 
   

     const handleNextPatient = useCallback(() => {
                const pIndex = patientIndex as number % pageLimit + 1;
                const patient_number = ((pageNumber-1)*pageLimit)+pIndex+1;
                setPatientNumber(patient_number);
                setBpInfoError('');
                setTpInfoError('');
                setAgeInfoError('');
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
        setBpInfoError('');
        setTpInfoError('');
        setAgeInfoError('');
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

    const handleAnswerSubmit = () => {
            const results = {
                high_risk_patients: highRiskPatients,
                fever_patients: feverPatients,
                data_quality_issues: dataQualityIssues,
            };

            fetch('https://assessment.ksensetech.com/api/submit-assessment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', 
                    'x-api-key': process.env.API_KEY as string
                },
                body: JSON.stringify(results)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Assessment Results:', data);
            });

    };

    return (
        <>
                { true && 
                    <div>
                        <h1 className="mb-2 p-2 bg-gray-100  rounded-sm text-2xl text-center font-bold tracking-tight">Patients Risk Scoring</h1>
                    </div>
                }

                { readyToSubmit && !notYet &&
                    <div className="text-center bg-white border border-gray-500 p-3 rounded-md shadow-sm hover:bg-gray-100">
                        <p className="font-normal overflow-y-auto border-l border-r border-b border-gray-300 bg-gray-50 text-left text-sm p-6 text-blue-700 dark:text-gray-400">{`High Risk Patient (Ids): ${highRiskPatients}`}</p>
                        <p className="font-normal overflow-y-auto border-l border-r border-b border-gray-300 bg-gray-50 text-left text-sm p-6 text-blue-700 dark:text-gray-400">{`Fever Patient (Ids): ${feverPatients}`}</p>
                        <p className="font-normal overflow-y-auto border-l border-r border-b border-gray-300 bg-gray-50 text-left text-sm p-6 text-blue-700 dark:text-gray-400">{`Data Quality Issues (Ids): ${dataQualityIssues}`}</p>

                        <div className="flex items-center justify-center">
                            <button type="button" 
                                className="flex items-center justify-center h-10  mt-5  text-white bg-blue-500 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2" 
                                onClick={handleAnswerSubmit}>Ready to Submit?
                            </button>  
                            <button type="button" 
                                className="flex items-center justify-center h-10  mt-5  text-white bg-red-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2" 
                                onClick={() => setNotYet(true)}>Not Yet
                            </button>  
                        </div>      
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
                        { patientNumber < (totalPatients) &&
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

                                    <div key={patient?.patient_id} className="text-center bg-blue-50 border border-gray-500 p-3 rounded-md shadow-sm hover:bg-gray-100">
                                            <div className="text-center p-1 bg-gray-300 text-2xl font-bold mb-5">{`Patient ${patientNumber} of ${totalPatients}`}</div>
                                            <h2 className="p-1  bg-gray-300 text-1xl font-bold tracking-tight text-gray-900 dark:text-white">{patient.name}</h2>
                                            <p className="font-normal p-1 text-gray-700 dark:text-gray-400">{`Patient Id: ${patient.patient_id}`}</p>                                    
                                            <p className="font-normal p-1 text-gray-700 dark:text-gray-400">{`Patient Name: ${patient.name}`}</p>                                    
                                            <p className="font-normal p-1 text-gray-700 dark:text-gray-400">{`Patient Age: ${patient.age}`}</p>                                    
                                            <p className="font-normal p-1 text-gray-700 dark:text-gray-400">{`Patient Gender: ${patient.gender}`}</p>                                    
                                            <p className="font-normal p-1 text-gray-700 dark:text-gray-400">{`Patient Blood Pressure: ${patient.blood_pressure}`}</p>                                    
                                            <p className="font-normal p-1 text-gray-700 dark:text-gray-400">{`Patient Temperature: ${patient.temperature}`}</p>                                    
                                            <p className="font-normal p-1 text-gray-700 dark:text-gray-400">{`Patient Visit Date: ${patient.visit_date}`}</p>                                    
                                            <p className="font-normal p-1 text-gray-700 dark:text-gray-400">{`Patient Diagnosis: ${patient.diagnosis}`}</p>                                    
                                            <p className="font-normal p-1 text-gray-700 dark:text-gray-400">{`Patient Medications: ${patient.medications}`}</p>
                                            { totalRisk !== null &&
                                                <p className="font-normal text-center p-3  bg-gray-100 text-blue-500 border-t border-l border-r border-gray-300 dark:text-gray-400">{`The Total Risk for ( ${patient.name} ) is ${totalRisk}.`}</p>                                    
                                                
                                            }   
                                            { totalRisk !== null && totalRisk >= 4 &&
                                                <p className="font-normal text-center p-3 bg-gray-100  text-red-500 border-b border-l border-r border-gray-300 dark:text-gray-400">{`High Risk Patient ( ${patient.name} ) with Total Risk of ${totalRisk}.`}</p>                                    
                                                
                                            }      
                                    </div>
                                    
                                    
                                )
                               
                            ))
                        }
                        {
                            response.patients?.map((patient:Patient, index:number) => (
                                ( index === patientIndex &&

                                    <div key={patient?.patient_id} className="text-center bg-yellow-50 border border-gray-500 p-3 rounded-md shadow-sm hover:bg-gray-100">
                                            {/*<div className="text-center  bg-gray-300 text-lg font-bold mb-5">{`Patient ${patientNumber} of ${totalPatients}`}</div>*/}
                                            <h2 className="p-1 bg-gray-300 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Blood Pressure Risk</h2>
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">Note: If systolic and diastolic readings fall into different risk categories, use the higher risk stage for scoring.</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Normal (Systolic <120 AND Diastolic <80): ${0} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Elevated (Systolic 120‑129 AND Diastolic <80): ${1} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Stage 1 (Systolic 130‑139 OR Diastolic 80‑89): ${2} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Stage 2 (Systolic ≥140 OR Diastolic ≥90): ${3} points`}</p> 
                                            { bloodPressureRisk !== null &&
                                                <p className="font-normal text-left p-2 bg-gray-50 text-blue-500 border border-gray-300 dark:text-gray-400">{`The Blood Pressure Risk for ${patient.name} is ${bloodPressureRisk}.`}</p>                                    
                                                
                                            }   
                                                                                
                                            <p className="font-normal text-left p-2 text-red-500 mt-2 bg-gray-50 border-gray-300 border-t border-r border-l  dark:text-gray-400">{`Invalid/Missing Data (0 points):`}</p>  
                                           
                                            { infoBpError === '' &&
                                            <div>
                                                <p className="font-normal text-left text-sm p-2 border-l border-r bg-gray-50  border-gray-300  text-gray-700 dark:text-gray-400">{`• Missing systolic or diastolic values ${'(e.g., "150/" or "/90")'}`}</p>                                    
                                                <p className="font-normal text-left text-sm p-2 border-l border-r  bg-gray-50 border-gray-300  text-gray-700 dark:text-gray-400">{`• Non-numeric values ${'(e.g., "INVALID", "N/A")'}`}</p>                                    
                                                <p className="font-normal text-left text-sm p-2 border-l border-b border-r bg-gray-50  border-gray-300  text-gray-700 dark:text-gray-400">{`• Null, undefined, or empty values`}</p>  
                                            </div>
                                            }
                                            { infoBpError !== '' &&
                                                <p className="font-normal overflow-y-auto border-l border-r border-b border-gray-300 bg-gray-50 text-left text-sm p-6 text-red-500 dark:text-gray-400">{infoBpError}</p>
                                            }                                  
                                          
                                    </div>
                                )                               
                            ))
                        }
                        {
                            response.patients?.map((patient:Patient, index:number) => (
                                ( index === patientIndex &&

                                    <div key={patient?.patient_id} className="text-center bg-green-50 border border-gray-500 p-3 rounded-md shadow-sm hover:bg-gray-100">
                                            {/*<div className="text-center  bg-gray-300 text-lg font-bold mb-5">{`Patient ${patientNumber} of ${totalPatients}`}</div>*/}
                                            <h2 className="p-1  bg-gray-300 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Temperature Risk</h2>
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Normal (≤99.5°F): ${0} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Low Fever (99.6-100.9°F): ${1} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`High Fever (≥‮0.101‬°F): ${2} points`}</p>                                        
                                            { temperatureRisk !== null &&
                                                <p className="font-normal text-left p-2  bg-gray-50  text-blue-500 border border-gray-300 dark:text-gray-400">{`The Temperature Risk for ${patient.name} is ${temperatureRisk}.`}</p>                                    
                                                
                                            }    
                                            { Number(patient?.temperature) >= 99.6 &&
                                                <p className="font-normal text-left p-3 bg-gray-50  text-red-500 border-b border-l border-r border-gray-300 dark:text-gray-400">{`The Patient ( ${patient.name} ) has High Fever with Temperature of ${patient.temperature}.`}</p>                                    
                                                
                                            }      
                                            <p className="font-normal text-left p-3 bg-gray-50 mt-5 text-red-500 border-t border-r border-l border-gray-300 dark:text-gray-400">{`Invalid/Missing Data (0 points):`}</p>                                    
                                           
                                            { infoTpError === '' &&
                                                <div>
                                                    <p className="font-normal text-left border-l border-r border-gray-300 bg-gray-50 text-sm p-2 text-gray-700 dark:text-gray-400">{`• Non-numeric values ${'(e.g., "TEMP_ERROR", "invalid")'}`}</p>                                    
                                                    <p className="font-normal text-left border-b border-l border-r border-gray-300  bg-gray-50 text-sm p-2 text-gray-700 dark:text-gray-400">{`• Null, undefined, or empty values`}</p>    
                                                </div>
                                            }
                                            { infoTpError !== '' &&
                                                <p className="font-normal overflow-y-auto bg-gray-50 text-left text-sm p-6 text-red-500 dark:text-gray-400">{infoTpError}</p>
                                            }                  
                                    </div>   
                                )
                            ))
                        }
                        {
                            response.patients?.map((patient:Patient, index:number) => (
                                ( index === patientIndex &&

                                    <div key={patient?.patient_id} className="text-center bg-fuchsia-100 border border-gray-500 p-3 rounded-md shadow-sm hover:bg-fuchsia-200">
                                            {/*<div className="text-center  bg-gray-300 text-lg font-bold mb-5">{`Patient ${patientNumber} of ${totalPatients}`}</div>*/}
                                            <h2 className="p-1  bg-gray-300 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Age Risk</h2>
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Under 40 (<40 years): 1 points ${0} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`40-65 (40-65 years, inclusive): ${1} points`}</p>                                    
                                            <p className="font-normal text-left p-2 text-gray-700 dark:text-gray-400">{`Over 65 (>65 years): ${2} points`}</p>                                        
                                            
                                            { ageRisk !== null &&
                                                <p className="font-normal text-left p-2 text-blue-500 border bg-gray-100 border-gray-300 dark:text-gray-400">{`The Age Risk for ${patient.name} is ${ageRisk}.`}</p>                                    
                                                
                                            }   
                                         
                                            <p className="font-normal text-left p-2 text-red-500 border-t mt-2 bg-gray-50 border-gray-300 dark:text-gray-400">{`Invalid/Missing Data (0 points):`}</p>
                                            { infoAgeError === '' &&
                                                <div>
                                                    <p className="font-normal text-left text-sm p-2 bg-gray-50  text-gray-700 dark:text-gray-400">{`• Null, undefined, or empty values`}</p> 
                                                    <p className="font-normal text-left text-sm p-2  bg-gray-50 text-gray-700 dark:text-gray-400">{`• Non-numeric strings (e.g., "fifty-three", "unknown")`}</p>      
                                                 </div>
                                            }
                                            { infoAgeError !== '' &&
                                                <p className="font-normal overflow-y-auto  bg-gray-50  text-left text-sm p-6 text-red-500 dark:text-gray-400">{infoAgeError}</p>
                                            }            
                                   
                                   
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
