import express, { urlencoded } from "express"
import twilio from "twilio"
import { config } from "dotenv"
import pkg from "twilio"
const { twiml } = pkg

config()

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = twilio(accountSid, authToken)
const TWILIO_SENDER = process.env.TWILIO_FROM
const TWILIO_RECEIVER  = process.env.TWILIO_To

const app = express()
app.use(urlencoded({ extended: true }))

app.post('/', (req, res) => {
      const VoiceResponse = twiml.VoiceResponse
      const response = new VoiceResponse()
      const MEDIA_URL = process.env.TWILIO_MEDIA

  
      response.play(`${MEDIA_URL}`)

  
  const gather = response.gather({
    input: 'dtmf',
    timeout: 10, 
    action: '/handle-input' 
  })

  res.type('text/xml')
  res.send(response.toString())
})


app.post('/handle-input', async (req, res) => {
  const VoiceResponse = twiml.VoiceResponse
  const response = new VoiceResponse()

  const digits = req.body.Digits
  const TO_NUMBER = `${TWILIO_RECEIVER}` 

  if (digits === '1') {
    if (TO_NUMBER !== `${TWILIO_SENDER}`) { 
      try {
        await client.messages.create({
          body: 'Here is the interview link you requested: https://v.personaliz.ai/?id=9b697c1a&uid=fe141702f66c760d85ab&mode=test',
          from: `${TWILIO_SENDER}`, 
          to: TO_NUMBER 
        })
        response.say('A text message with the interview link has been sent to your number GoodBye.')
      } catch (error) {
        console.log('Error sending SMS:', error)
        response.say('There was an error sending the message.')
      }
    } else {
      response.say('Invalid phone number.')
    }
  }
    else if (digits === '2') {
    
        response.say('Okay, hanging up now.')         
        response.hangup()
    }
  
  else {
      
    response.say('You did not press the correct key.')
  }

  response.hangup()
  
  res.type('text/xml')
  res.send(response.toString())
})

async function createCall() {

  const ENDPOINT_URL = process.env.TWILIO_ENDPOINT_URL

  try {
    const call = await client.calls.create({
      from: `${TWILIO_SENDER}`, 
      to: `${TWILIO_RECEIVER}`, 
      url: `${ENDPOINT_URL}`,  
      method: 'POST'
    })

    console.log(`Call SID: ${call.sid}`)
  } catch (error) {
    console.log('Error creating call:', error)
  }
}

app.listen(3000, () => { 
      console.log('Server is running on port 3000')
      createCall() 
})
