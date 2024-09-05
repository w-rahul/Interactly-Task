import dotenv from "dotenv"
import axios from "axios"
import express from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

dotenv.config();

const API_KEY = process.env.API_KEY 
const DOMAIN = process.env.DOMAIN 

const app =  express()
app.use(express.json())

app.post("/createContact", async (req, res) => {
    const { first_name, last_name, email, mobile_number, data_store } = req.body;

    if (data_store !== 'CRM' && data_store !== 'DATABASE') {
        return res.status(400).json({ message: "Invalid data_store value. Must be 'CRM' or 'DATABASE'" });
    }

    try {

    let finalresult

        if(data_store === 'CRM'){
        const response = await axios.post(
            `https://${DOMAIN}.myfreshworks.com/crm/sales/api/contacts`,
            {
                contact: {
                    first_name,
                    last_name,
                    email,
                    mobile_number,
                }
            },
            {
                headers: {
                    "Authorization": `Token token=${API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        finalresult = response.data
    }

    else{

        const ExistContact = await prisma.contact.findUnique({
            where:{
                email : email,
                mobile_number: mobile_number
            }
        }) 

        if(ExistContact){
            return res.status(404).json({message : `Contant with these creds is already present` })
        }

            const NewContact = await prisma.contact.create({
                data:{
                    first_name,
                    last_name,
                    email,
                    mobile_number
                }
            })   

            finalresult= NewContact         
    }

    return res.status(200).json(finalresult)
        
    } catch (error:any) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        return res.status(error.response ? error.response.status : 500).json({ 
            message: error.response ? error.response.data : "Internal server error" 
        });
    }    
});

app.get("/getContact/:contact_id",async (req,res)=>{

    const {data_store} = req.query
    const {contact_id} = req.params

    try {
        if(data_store === 'CRM'){
            const response = await axios.get(`https://${DOMAIN}.myfreshworks.com/crm/sales/api/contacts/${contact_id}`,{
                headers:{
                        "Authorization": `Token token=${API_KEY}`,
                        "Content-Type": "application/json"
                }
            })
            return res.status(200).json(response.data)
        }
    
        else if(data_store === 'DATABASE'){
            const contact = await prisma.contact.findUnique({
                where:{
                    id : Number(contact_id)
                },
                select:{
                    id : true,
                    first_name : true,
                    last_name : true,
                    email : true,
                    mobile_number : true,
                }
            })

            if(!contact){
                return res.status(404).json({
                    message : `The contact with id = ${contact_id} is not found`
                })
            }

            return res.status(200).json(contact)
         
        }
    
        else{
            return res.status(200).json({message : "Invalid data_store choice"})
        }    
    }  catch (error:any) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        return res.status(error.response ? error.response.status : 500).json({ 
            message: error.response ? error.response.data : "Internal server error" 
        });
    }
})

app.delete("/deletecontact/:contact_id", async (req,res)=>{
    const {contact_id} = req.params
    const {data_store} =  req.query

    if(data_store !== 'CRM' && data_store !== 'DATABASE'){
        return res.status(400).json(`the data_store value (${data_store}) is not correct`)
    }

    try {
    
    if(data_store === "CRM"){
        await axios.delete(`https://${DOMAIN}.myfreshworks.com/crm/sales/api/contacts/${contact_id}`,{
                headers:{
                    "Authorization": `Token token=${API_KEY}`,
                    "Content-Type": "application/json"
            }
    })
            return res.status(200).json({message : `The contact with ID = ${contact_id} is deleted successfully`})
    }
    
    else if(data_store === 'DATABASE'){

        const ExistContact = await prisma.contact.findUnique({
            where:{
                id : Number(contact_id)
            }
        }) 

        if(!ExistContact){
            return res.status(404).json({message : `Contant with ${contact_id} is not found` })
        }

        await prisma.contact.delete({
                where:{
                    id : Number(contact_id)
                }
        })   
            return res.status(200).json({message : `The contact with ID = ${contact_id} is deleted successfully`})  
        }
    
        else{
            return res.status(404).json({
                message : `Either the data_store value (${data_store} or contact_id (${contact_id}) is incorrect)`
            })
        }
        
    } catch (error:any)  {
        console.error('Error details:', error.response ? error.response.data : error.message);
        return res.status(error.response ? error.response.status : 500).json({ 
            message: error.response ? error.response.data : "Internal server error" 
        });
    }
    
})

app.put("/updatecontact/:contact_id", async (req,res)=>{

    
    const {contact_id} = req.params
    const { email, mobile_number, data_store } = req.body;

    if (data_store !== 'CRM' && data_store !== 'DATABASE') {
        return res.status(400).json({ message: "Invalid data_store value. Must be 'CRM' or 'DATABASE'" });
    }

    try {

    let finalresult

     if(data_store === 'CRM'){
        const response = await axios.put(
            `https://${DOMAIN}.myfreshworks.com/crm/sales/api/contacts/${contact_id}`,
            {
                contact: {
                    email,
                    mobile_number,
                }
            },
             {
                headers: {
                    "Authorization": `Token token=${API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        finalresult = response.data
    }
    else{
        const ExistContact = await prisma.contact.findUnique({
            where:{
                id : Number(contact_id)
            }
        }) 

        if(!ExistContact){
            return res.status(404).json({message : `Contant with ${contact_id} is not found` })
        }

            const NewContact = await prisma.contact.update({
                where:{
                    id : Number(contact_id)
                },
                data:{
                    email,
                    mobile_number
                }
            })   

            finalresult= NewContact         
    }
    return res.status(200).json(finalresult)
        
    } catch (error:any) {
        console.error('Error details:', error.response ? error.response.data : error.message);
        return res.status(error.response ? error.response.status : 500).json({ 
            message: error.response ? error.response.data : "Internal server error" 
        })
    }    
})

app.listen(3000)