import React from "react";

export default function WhatsAppStyledChat() {
    const messages = [
        {
            "datetime": "23/01/25, 8:45 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "25/01/25, 5:45 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "+919022833567"
        },
        {
            "datetime": "25/01/25, 5:45 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Tejal"
        },
        {
            "datetime": "25/01/25, 5:45 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Thank you for contacting us !"
        },
        {
            "datetime": "25/01/25, 5:45 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok"
        },
        {
            "datetime": "25/01/25, 5:45 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes mam"
        },
        {
            "datetime": "26/01/25, 10:46 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Rohittttttt callll uthaaaaaaa"
        },
        {
            "datetime": "26/01/25, 1:00 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "😜😝oooppss"
        },
        {
            "datetime": "26/01/25, 1:24 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Rohit 4 baje tak aja"
        },
        {
            "datetime": "26/01/25, 1:25 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Adhe ghante me batati hu tujhe"
        },
        {
            "datetime": "26/01/25, 1:48 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Okaayyy"
        },
        {
            "datetime": "26/01/25, 2:11 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "4.30 tak ana"
        },
        {
            "datetime": "26/01/25, 2:18 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Okay mam"
        },
        {
            "datetime": "26/01/25, 2:18 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "👍🏻"
        },
        {
            "datetime": "30/01/25, 10:37 am",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20250130-WA0004.jpg (file attached)"
        },
        {
            "datetime": "30/01/25, 10:38 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Ye chalega mam...?"
        },
        {
            "datetime": "30/01/25, 10:39 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Pant niche ?"
        },
        {
            "datetime": "30/01/25, 10:40 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Dusra dekhu?"
        },
        {
            "datetime": "30/01/25, 10:41 am",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20250130-WA0006.jpg (file attached)"
        },
        {
            "datetime": "30/01/25, 10:43 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ye accha hai"
        },
        {
            "datetime": "30/01/25, 10:45 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Fix?"
        },
        {
            "datetime": "19/12/25, 11:37 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Rohit hai kay ?"
        },
        {
            "datetime": "19/12/25, 11:37 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Call karu ka"
        },
        {
            "datetime": "19/12/25, 11:37 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Thode urgent ahe"
        },
        {
            "datetime": "02/01/26, 12:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Rohit tujhe 5th ko 12 to 1 jamega kya"
        },
        {
            "datetime": "02/01/26, 12:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Wo session lene"
        },
        {
            "datetime": "02/01/26, 12:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Follow dance ka"
        },
        {
            "datetime": "02/01/26, 12:44 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "yes…."
        },
        {
            "datetime": "02/01/26, 12:44 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Thank you for contacting us !"
        },
        {
            "datetime": "04/01/26, 8:16 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Create a video of school girl and school boy ithe their love story make them wear school dress put G letter on boys shirt and V on girl school dress. There looking in each other eyes and waalking towards each other make video of 20 sec"
        },
        {
            "datetime": "04/01/26, 9:01 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I'm trying, ai thoda time laga raha hai , kya pata"
        },
        {
            "datetime": "04/01/26, 9:10 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Koi bat nai bhejte"
        },
        {
            "datetime": "04/01/26, 9:11 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "nhi ho gaya,"
        },
        {
            "datetime": "04/01/26, 9:11 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "but getting a 8 sec video in VEO3 by GOogle ke isme"
        },
        {
            "datetime": "04/01/26, 9:12 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ohh thik hai kesa aa raha hai"
        },
        {
            "datetime": "04/01/26, 9:12 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "04/01/26, 9:12 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "😅"
        },
        {
            "datetime": "04/01/26, 9:12 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "You've reached your video generation limit until 4 Jan, 9:39 pm"
        },
        {
            "datetime": "04/01/26, 9:12 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "can edit, it, in a different, way, just wanted to check how can it come"
        },
        {
            "datetime": "04/01/26, 9:19 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "https://app.klingai.com/global/text-to-video/new"
        },
        {
            "datetime": "04/01/26, 9:19 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "You are an 15+ experienced"
        },
        {
            "datetime": "04/01/26, 10:37 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Adding that context of 15+ years experienced...part will make it more productive"
        },
        {
            "datetime": "05/01/26, 8:18 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok"
        },
        {
            "datetime": "05/01/26, 8:18 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Me call karte tula"
        },
        {
            "datetime": "05/01/26, 8:18 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Uthla ki sang mag boluya apan"
        },
        {
            "datetime": "05/01/26, 11:47 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Ho mam, uthlo.... I'll call you after I freshenup"
        },
        {
            "datetime": "05/01/26, 12:03 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Are tyancha parat msg ala hota te corporate wale yede ahet"
        },
        {
            "datetime": "05/01/26, 12:03 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Parat time change karat ahe"
        },
        {
            "datetime": "05/01/26, 3:43 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "3pm to 4pm jamega kya"
        },
        {
            "datetime": "05/01/26, 3:43 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "7th ko"
        },
        {
            "datetime": "05/01/26, 3:56 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "😁😁"
        },
        {
            "datetime": "05/01/26, 3:56 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan chalega... This is like good time for me too"
        },
        {
            "datetime": "05/01/26, 4:18 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok"
        },
        {
            "datetime": "05/01/26, 4:18 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "yes"
        },
        {
            "datetime": "05/01/26, 4:19 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "👍🏻"
        },
        {
            "datetime": "06/01/26, 12:27 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "AI Image and Video Pricing from $12/month | Runway AI https://share.google/NiFPCVpIGrkGDECH1"
        },
        {
            "datetime": "06/01/26, 12:28 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Check this"
        },
        {
            "datetime": "06/01/26, 12:53 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok ye 1200 bol raha hai monthly ?"
        },
        {
            "datetime": "06/01/26, 12:53 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Tune jisme kiya na usi me hum karenge"
        },
        {
            "datetime": "06/01/26, 12:53 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Aj bhetuya apan 3.30 ?"
        },
        {
            "datetime": "06/01/26, 12:53 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yeah, works"
        },
        {
            "datetime": "06/01/26, 12:53 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan"
        },
        {
            "datetime": "06/01/26, 12:54 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Chalega... let's see"
        },
        {
            "datetime": "06/01/26, 12:54 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Done"
        },
        {
            "datetime": "06/01/26, 2:40 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hey"
        },
        {
            "datetime": "06/01/26, 2:40 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "3.30 ko mil rahe hai na hum"
        },
        {
            "datetime": "06/01/26, 3:35 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Reaching in 15 mins"
        },
        {
            "datetime": "06/01/26, 3:35 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Near jupiter hospital"
        },
        {
            "datetime": "06/01/26, 3:56 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I've reached"
        },
        {
            "datetime": "06/01/26, 6:31 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260106-WA0021.jpg (file attached)"
        },
        {
            "datetime": "06/01/26, 6:31 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260106-WA0025.jpg (file attached)"
        },
        {
            "datetime": "06/01/26, 6:31 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260106-WA0024.jpg (file attached)"
        },
        {
            "datetime": "06/01/26, 6:37 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260106-WA0023.jpg (file attached)"
        },
        {
            "datetime": "06/01/26, 6:37 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260106-WA0022.jpg (file attached)"
        },
        {
            "datetime": "07/01/26, 7:22 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Hello mam,"
        },
        {
            "datetime": "07/01/26, 7:22 am",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260107-WA0002.jpg (file attached)"
        },
        {
            "datetime": "07/01/26, 7:23 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "PENNIE got total 8 times of  Epilepsy."
        },
        {
            "datetime": "07/01/26, 7:23 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "We had to admit her...here, aundh"
        },
        {
            "datetime": "07/01/26, 7:23 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I suppose, it won't be possible.....mostly, I'll get to know by 10."
        },
        {
            "datetime": "07/01/26, 7:23 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I'm just informing"
        },
        {
            "datetime": "07/01/26, 7:24 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I'm really sorry about it mam...."
        },
        {
            "datetime": "07/01/26, 7:24 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "If this was not an emergency....i wouldn't have"
        },
        {
            "datetime": "07/01/26, 7:24 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "So....."
        },
        {
            "datetime": "07/01/26, 7:25 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes yes no prb"
        },
        {
            "datetime": "07/01/26, 7:25 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Thik hai na won"
        },
        {
            "datetime": "07/01/26, 7:25 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Penny"
        },
        {
            "datetime": "07/01/26, 7:40 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Abhi tho stable hai"
        },
        {
            "datetime": "07/01/26, 7:41 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Mai Ronnie ko puchu kya?"
        },
        {
            "datetime": "07/01/26, 7:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hana"
        },
        {
            "datetime": "07/01/26, 7:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Kiske bare me"
        },
        {
            "datetime": "07/01/26, 7:42 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Aaj ka"
        },
        {
            "datetime": "07/01/26, 7:42 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "3-4"
        },
        {
            "datetime": "07/01/26, 7:42 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "If in worst condition"
        },
        {
            "datetime": "07/01/26, 7:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Are you"
        },
        {
            "datetime": "07/01/26, 7:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha puch"
        },
        {
            "datetime": "07/01/26, 7:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Puch puch koi bat nai"
        },
        {
            "datetime": "07/01/26, 7:43 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "...?"
        },
        {
            "datetime": "07/01/26, 7:52 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Are ha"
        },
        {
            "datetime": "07/01/26, 7:52 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "😅"
        },
        {
            "datetime": "07/01/26, 8:02 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Oh acha"
        },
        {
            "datetime": "07/01/26, 8:02 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I thought something"
        },
        {
            "datetime": "07/01/26, 8:02 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Mam really sorry about this"
        },
        {
            "datetime": "07/01/26, 8:03 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "If it was not this extreme i would haven't"
        },
        {
            "datetime": "07/01/26, 8:11 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes yes I can understand"
        },
        {
            "datetime": "07/01/26, 8:11 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "No prb beta"
        },
        {
            "datetime": "07/01/26, 8:11 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ronnie ko puchle"
        },
        {
            "datetime": "07/01/26, 8:17 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan"
        },
        {
            "datetime": "07/01/26, 9:21 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Rohit tune pucha kya ?"
        },
        {
            "datetime": "07/01/26, 9:22 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ashish le sakta kay?"
        },
        {
            "datetime": "07/01/26, 9:22 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Ronnie said, he'll let me know in a while. Should I ask Nagesh?"
        },
        {
            "datetime": "07/01/26, 9:22 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan, puchta hun usko ek baar"
        },
        {
            "datetime": "07/01/26, 9:22 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha puch"
        },
        {
            "datetime": "07/01/26, 9:22 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Okay"
        },
        {
            "datetime": "07/01/26, 9:22 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Wo  bollywood ke sakta na"
        },
        {
            "datetime": "07/01/26, 9:22 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan actually isiliye nhi pucha"
        },
        {
            "datetime": "07/01/26, 9:31 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "https://www.instagram.com/bakasur_chikoo?igsh=YTNodWd2cDM0Y3px"
        },
        {
            "datetime": "07/01/26, 9:31 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "He's available"
        },
        {
            "datetime": "07/01/26, 9:35 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Mala no pathw"
        },
        {
            "datetime": "07/01/26, 9:35 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "+919960391692"
        },
        {
            "datetime": "07/01/26, 9:35 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Naam?"
        },
        {
            "datetime": "07/01/26, 9:36 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Chikoo"
        },
        {
            "datetime": "07/01/26, 9:36 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok"
        },
        {
            "datetime": "07/01/26, 9:36 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "07/01/26, 9:36 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Chikoo real name hai"
        },
        {
            "datetime": "07/01/26, 9:36 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ya dance name hai"
        },
        {
            "datetime": "07/01/26, 9:36 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Dance name"
        },
        {
            "datetime": "07/01/26, 9:37 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Tyala bol playlist ready karun jashil"
        },
        {
            "datetime": "07/01/26, 9:37 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Real name bata"
        },
        {
            "datetime": "07/01/26, 9:37 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Wese unko bolna padega"
        },
        {
            "datetime": "07/01/26, 9:37 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Acha...thike..."
        },
        {
            "datetime": "07/01/26, 9:37 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha"
        },
        {
            "datetime": "07/01/26, 9:38 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yash Gaikwad"
        },
        {
            "datetime": "07/01/26, 9:38 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok"
        },
        {
            "datetime": "07/01/26, 9:39 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "09/01/26, 11:12 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "+91 80073 76934"
        },
        {
            "datetime": "09/01/26, 3:01 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Hello"
        },
        {
            "datetime": "09/01/26, 3:01 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Mam"
        },
        {
            "datetime": "09/01/26, 3:01 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Tu hai kya uder"
        },
        {
            "datetime": "09/01/26, 3:01 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "09/01/26, 3:01 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok me yete mag"
        },
        {
            "datetime": "09/01/26, 3:01 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Nighale"
        },
        {
            "datetime": "09/01/26, 3:01 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes yes"
        },
        {
            "datetime": "09/01/26, 3:03 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "👍🏻"
        },
        {
            "datetime": "09/01/26, 6:35 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260109-WA0017.jpg (file attached)"
        },
        {
            "datetime": "09/01/26, 6:35 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260109-WA0019.jpg (file attached)"
        },
        {
            "datetime": "09/01/26, 6:35 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260109-WA0018.jpg (file attached)"
        },
        {
            "datetime": "09/01/26, 9:52 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Great"
        },
        {
            "datetime": "10/01/26, 11:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Rohittttttt"
        },
        {
            "datetime": "10/01/26, 11:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Tu call karne wala tha"
        },
        {
            "datetime": "11/01/26, 2:53 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Bride – Vaibhavi (Upload as ONE reference set)"
        },
        {
            "datetime": "11/01/26, 3:42 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Started the first generation of video…HOPING FOR BEST"
        },
        {
            "datetime": "11/01/26, 3:42 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "😰"
        },
        {
            "datetime": "11/01/26, 4:16 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "11/01/26, 4:16 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "11/01/26, 4:16 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "11/01/26, 4:33 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "11/01/26, 4:36 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ye wala"
        },
        {
            "datetime": "11/01/26, 7:41 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "mam vo sejal ka photos bhejo na"
        },
        {
            "datetime": "11/01/26, 7:41 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha"
        },
        {
            "datetime": "11/01/26, 7:57 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0012.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 7:57 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0013.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 7:57 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0014.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 7:57 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0015.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 7:57 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0020.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 7:57 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0016.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 7:57 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0019.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 7:57 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0017.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 7:57 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0018.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 7:57 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "11/01/26, 7:57 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Acha hai ye"
        },
        {
            "datetime": "11/01/26, 7:58 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan na .."
        },
        {
            "datetime": "11/01/26, 8:08 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260111-WA0021.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 8:14 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Nai lageiii 😂😂"
        },
        {
            "datetime": "11/01/26, 8:15 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Nahi lagri?"
        },
        {
            "datetime": "11/01/26, 8:15 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "😁😝"
        },
        {
            "datetime": "11/01/26, 8:15 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "😅😅😂"
        },
        {
            "datetime": "11/01/26, 8:15 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Will try to modify accordingly"
        },
        {
            "datetime": "11/01/26, 8:20 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "What about Sejals photo>"
        },
        {
            "datetime": "11/01/26, 8:20 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Tujhe"
        },
        {
            "datetime": "11/01/26, 8:20 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Daure no se bheja hai"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0012.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0013.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0014.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0015.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0020.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0016.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0019.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0017.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260111-WA0018.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "who is the above?"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Sejal"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hai"
        },
        {
            "datetime": "11/01/26, 8:21 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "ohhhhh"
        },
        {
            "datetime": "11/01/26, 8:22 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "can I get, the same for vaibhavi and Gitesh, with the above description"
        },
        {
            "datetime": "11/01/26, 8:22 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes yes me sangitle ahe"
        },
        {
            "datetime": "11/01/26, 8:22 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260111-WA0022.jpg (file attached)"
        },
        {
            "datetime": "11/01/26, 8:23 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "GITESH"
        },
        {
            "datetime": "11/01/26, 8:23 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "😁😛"
        },
        {
            "datetime": "11/01/26, 8:24 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ohhhh sahi lag raha hai"
        },
        {
            "datetime": "11/01/26, 8:25 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan na..."
        },
        {
            "datetime": "11/01/26, 8:25 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hana"
        },
        {
            "datetime": "11/01/26, 8:25 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Sahi lag raha hai"
        },
        {
            "datetime": "11/01/26, 8:26 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Going for sejal"
        },
        {
            "datetime": "11/01/26, 8:26 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok 👍🏻"
        },
        {
            "datetime": "11/01/26, 8:34 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "11/01/26, 9:54 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Realistic nai mila toh b chalega"
        },
        {
            "datetime": "11/01/26, 9:54 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Animated me hi rakhey hai"
        },
        {
            "datetime": "11/01/26, 9:56 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "."
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0003.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0004.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0005.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0006.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0008.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0009.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0010.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0011.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0012.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0013.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0014.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0015.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0016.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0017.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0018.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0019.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0021.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0023.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0027.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0025.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0029.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0031.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0033.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0035.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0051.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0049.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0037.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0047.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0039.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0045.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0043.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260112-WA0041.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 10:48 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Great"
        },
        {
            "datetime": "12/01/26, 10:53 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Mam, Suno na. Aapka iphone ka charger ka pin, Iphone ka hai ya type c?"
        },
        {
            "datetime": "12/01/26, 10:53 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Type c hai"
        },
        {
            "datetime": "12/01/26, 10:53 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Ohh, acha. Thike....."
        },
        {
            "datetime": "12/01/26, 10:54 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "No one of my friends forgot her charger so..."
        },
        {
            "datetime": "12/01/26, 11:51 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ohhhhh"
        },
        {
            "datetime": "12/01/26, 11:51 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Me lati hu"
        },
        {
            "datetime": "12/01/26, 11:52 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Par me late aaungi matlab 5 baje"
        },
        {
            "datetime": "12/01/26, 12:11 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Nhi nhi, lightning chahiye tha... No worries"
        },
        {
            "datetime": "12/01/26, 12:11 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Chalega"
        },
        {
            "datetime": "12/01/26, 12:20 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha lau na"
        },
        {
            "datetime": "12/01/26, 12:21 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Nhi nhi, Got it. Took a new cable itself"
        },
        {
            "datetime": "12/01/26, 1:04 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok"
        },
        {
            "datetime": "12/01/26, 1:09 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "yes, thank you"
        },
        {
            "datetime": "12/01/26, 8:21 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260112-WA0081.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 8:22 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260112-WA0085.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 8:22 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260112-WA0084.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 8:22 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260112-WA0083.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 8:22 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260112-WA0082.jpg (file attached)"
        },
        {
            "datetime": "12/01/26, 8:22 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Mic e"
        },
        {
            "datetime": "12/01/26, 8:22 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "yes yes, MICE"
        },
        {
            "datetime": "12/01/26, 8:22 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha sahi hai ye"
        },
        {
            "datetime": "12/01/26, 8:22 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Dekh ye acha lag raha hai na"
        },
        {
            "datetime": "12/01/26, 8:23 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "haaan"
        },
        {
            "datetime": "12/01/26, 8:23 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "righttt"
        },
        {
            "datetime": "12/01/26, 8:23 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "looking dramatic"
        },
        {
            "datetime": "12/01/26, 9:46 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "12/01/26, 9:49 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Acha hai"
        },
        {
            "datetime": "12/01/26, 9:51 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "So vaibhavi ka dress change karne ko hoga kya"
        },
        {
            "datetime": "12/01/26, 9:52 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "haan…."
        },
        {
            "datetime": "12/01/26, 9:52 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha"
        },
        {
            "datetime": "12/01/26, 9:52 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I’ll do that"
        },
        {
            "datetime": "12/01/26, 10:50 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "❤️"
        },
        {
            "datetime": "16/01/26, 3:31 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "VID-20260121-WA0008.mp4 (file attached)"
        },
        {
            "datetime": "16/01/26, 3:32 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Accha hai"
        },
        {
            "datetime": "16/01/26, 3:32 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ye wala hi use karna hai hume"
        },
        {
            "datetime": "16/01/26, 3:34 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "ooops haan, forgot"
        },
        {
            "datetime": "16/01/26, 3:34 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "😅😅"
        },
        {
            "datetime": "16/01/26, 3:34 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "was just adding it to the SCENE"
        },
        {
            "datetime": "16/01/26, 3:34 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes 👍🏻"
        },
        {
            "datetime": "16/01/26, 3:34 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "this I generated from CHATGPT alag se so"
        },
        {
            "datetime": "16/01/26, 3:34 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "cool"
        },
        {
            "datetime": "16/01/26, 3:35 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha"
        },
        {
            "datetime": "16/01/26, 8:42 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Chikoo is ready"
        },
        {
            "datetime": "16/01/26, 10:26 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "16/01/26, 10:26 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "how does this feel, comparing to previous landing page design"
        },
        {
            "datetime": "16/01/26, 10:27 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "the prev one, was just aise hi..this is the redesigned one <This message was edited>"
        },
        {
            "datetime": "16/01/26, 10:30 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Niceee acha lag raha hai"
        },
        {
            "datetime": "16/01/26, 10:31 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "thank you…"
        },
        {
            "datetime": "16/01/26, 10:33 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes yes definitely. It ll be very interesting and helpful for us"
        },
        {
            "datetime": "16/01/26, 10:33 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "yeah, fingers crossed😅"
        },
        {
            "datetime": "17/01/26, 12:01 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "🤗"
        },
        {
            "datetime": "17/01/26, 9:00 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Good morning Rohit aj 5 baje rehersal hai"
        },
        {
            "datetime": "17/01/26, 9:00 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Tujhe kese jamega"
        },
        {
            "datetime": "17/01/26, 9:10 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Ahh ...  I have to reach 6, matlab at least 5:30 at the event place."
        },
        {
            "datetime": "17/01/26, 9:10 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "So,......"
        },
        {
            "datetime": "17/01/26, 9:10 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Kaise kare"
        },
        {
            "datetime": "17/01/26, 9:10 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Aj mat aa fir tu"
        },
        {
            "datetime": "17/01/26, 9:10 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Kalse evenings free rakh kyunki evenings ko hi hoga rehersals"
        },
        {
            "datetime": "17/01/26, 9:11 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes yes"
        },
        {
            "datetime": "17/01/26, 11:56 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Chikoo ka fix hai ?"
        },
        {
            "datetime": "18/01/26, 12:38 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan"
        },
        {
            "datetime": "18/01/26, 9:17 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Aaj kitne bje hai?"
        },
        {
            "datetime": "18/01/26, 9:17 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Aj 6 baje hai"
        },
        {
            "datetime": "18/01/26, 9:17 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Like i have to reach"
        },
        {
            "datetime": "18/01/26, 9:17 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Right"
        },
        {
            "datetime": "18/01/26, 9:17 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "18/01/26, 9:17 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "At 6"
        },
        {
            "datetime": "18/01/26, 9:17 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Get me the address"
        },
        {
            "datetime": "18/01/26, 9:17 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "18/01/26, 9:17 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "18/01/26, 9:23 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Suno na, approx 6 to kitne bje tak rahega"
        },
        {
            "datetime": "18/01/26, 9:23 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "6 to 8 or 9"
        },
        {
            "datetime": "18/01/26, 9:24 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Acha ... Cool"
        },
        {
            "datetime": "18/01/26, 11:39 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "👍🏻"
        },
        {
            "datetime": "18/01/26, 4:36 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hi Rohit"
        },
        {
            "datetime": "18/01/26, 4:36 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Address bhejti hu"
        },
        {
            "datetime": "18/01/26, 4:37 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "location: https://maps.google.com/?q=18.474102020263672,73.86137390136719"
        },
        {
            "datetime": "18/01/26, 4:51 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "18/01/26, 4:51 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Got it"
        },
        {
            "datetime": "18/01/26, 5:03 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "👍🏻"
        },
        {
            "datetime": "19/01/26, 4:50 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "Arti Shivam duet v2.mp3 (file attached)"
        },
        {
            "datetime": "19/01/26, 5:02 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "Era friends Half.mp3 (file attached)"
        },
        {
            "datetime": "21/01/26, 7:42 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "https://share.google/8g2DYU0YmBQSemGPk"
        },
        {
            "datetime": "21/01/26, 8:53 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "Era friends v2.mp3 (file attached)"
        },
        {
            "datetime": "23/01/26, 6:12 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Mammm"
        },
        {
            "datetime": "23/01/26, 6:12 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Mission abort"
        },
        {
            "datetime": "24/01/26, 9:56 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Rohit aj class lene mat ja"
        },
        {
            "datetime": "24/01/26, 11:58 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Acha thik hai"
        },
        {
            "datetime": "25/01/26, 11:07 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Intrested"
        },
        {
            "datetime": "25/01/26, 11:07 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Shweta Mhasade"
        },
        {
            "datetime": "25/01/26, 11:07 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "https://www.instagram.com/shweta_mhasade?igsh=MWYwNGt5YzNqdmw2Nw%3D%3D&utm_source=qr"
        },
        {
            "datetime": "25/01/26, 11:07 am",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260123-WA0015.jpg (file attached)"
        },
        {
            "datetime": "25/01/26, 11:07 am",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260123-WA0016.jpg (file attached)"
        },
        {
            "datetime": "25/01/26, 11:07 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok"
        },
        {
            "datetime": "25/01/26, 11:07 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Let me know about her mam"
        },
        {
            "datetime": "25/01/26, 11:08 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Chalegi"
        },
        {
            "datetime": "25/01/26, 11:08 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "5th ke liye"
        },
        {
            "datetime": "25/01/26, 11:08 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Kaha rehti hai"
        },
        {
            "datetime": "25/01/26, 11:08 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan, 5th ka"
        },
        {
            "datetime": "25/01/26, 11:08 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "25/01/26, 11:08 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Idk, I'll ask"
        },
        {
            "datetime": "25/01/26, 11:08 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "25/01/26, 11:08 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Bolna chutti nai chalega"
        },
        {
            "datetime": "25/01/26, 11:09 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Bilkul 4 days rehersal hai"
        },
        {
            "datetime": "25/01/26, 11:09 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Chakannnnn"
        },
        {
            "datetime": "25/01/26, 11:09 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "😁"
        },
        {
            "datetime": "25/01/26, 11:09 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "😅😅😅"
        },
        {
            "datetime": "25/01/26, 11:09 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Subeh kese ayegi wo"
        },
        {
            "datetime": "25/01/26, 11:09 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "7 baje"
        },
        {
            "datetime": "25/01/26, 11:11 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I'll give your number, she is saying 2 days chalega kya...."
        },
        {
            "datetime": "25/01/26, 11:11 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Nai"
        },
        {
            "datetime": "25/01/26, 11:11 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Chalega"
        },
        {
            "datetime": "25/01/26, 11:11 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "4 din Ana pdega"
        },
        {
            "datetime": "25/01/26, 11:12 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "2 din jamega toh bat karke no use"
        },
        {
            "datetime": "25/01/26, 11:12 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan"
        },
        {
            "datetime": "25/01/26, 11:12 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Vhi bola"
        },
        {
            "datetime": "25/01/26, 11:12 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha"
        },
        {
            "datetime": "25/01/26, 11:12 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Chakan ka bahot dur hai re"
        },
        {
            "datetime": "25/01/26, 11:12 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Thdoa ider ka hi dekh 😅😅"
        },
        {
            "datetime": "25/01/26, 11:13 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haaan"
        },
        {
            "datetime": "25/01/26, 11:14 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Dekhta hun...."
        },
        {
            "datetime": "25/01/26, 11:14 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "But return usko khud karna padega karke bola hai"
        },
        {
            "datetime": "25/01/26, 11:26 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha nai bahot tamjhan hoga toh fir nai hoga b ha bolegi badme nai bolegi"
        },
        {
            "datetime": "25/01/26, 11:41 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Nhi, I've still left a message, I'll let you know ..by evening"
        },
        {
            "datetime": "25/01/26, 11:41 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Kaha mai ....."
        },
        {
            "datetime": "26/01/26, 3:28 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "AUD-20260126-WA0010.mp3 (file attached)"
        },
        {
            "datetime": "26/01/26, 5:04 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "🟠 *Gig ALERT* ( updated )"
        },
        {
            "datetime": "26/01/26, 5:47 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "https://gygs.in/"
        },
        {
            "datetime": "26/01/26, 6:29 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "26/01/26, 6:30 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "27/01/26, 12:06 am",
            "sender": "vrohithuta",
            "type": "media",
            "text": "VID-20260127-WA0000.mp4 (file attached)"
        },
        {
            "datetime": "27/01/26, 12:06 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "White shirt"
        },
        {
            "datetime": "27/01/26, 12:07 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Height ?"
        },
        {
            "datetime": "27/01/26, 10:09 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Lamba hai"
        },
        {
            "datetime": "27/01/26, 10:09 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Acha khasa"
        },
        {
            "datetime": "27/01/26, 10:10 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "5'6/7"
        },
        {
            "datetime": "27/01/26, 10:28 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hakya"
        },
        {
            "datetime": "27/01/26, 10:28 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Chalega"
        },
        {
            "datetime": "27/01/26, 11:42 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Done then"
        },
        {
            "datetime": "27/01/26, 11:42 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Na"
        },
        {
            "datetime": "27/01/26, 11:42 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Boys?"
        },
        {
            "datetime": "27/01/26, 11:42 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Mai, amol, ye banda aur kon"
        },
        {
            "datetime": "27/01/26, 12:02 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ek hai aur"
        },
        {
            "datetime": "27/01/26, 12:02 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ruk batati hu thodi der me b rehersal me hu"
        },
        {
            "datetime": "27/01/26, 12:02 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes yes"
        },
        {
            "datetime": "27/01/26, 12:07 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Chickoo b cancel kya"
        },
        {
            "datetime": "27/01/26, 12:21 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Nhi nhi hai na vo"
        },
        {
            "datetime": "27/01/26, 12:21 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Mai, chikoo, amol and haan ye white shirt"
        },
        {
            "datetime": "27/01/26, 12:22 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Mai khud ka bhul hi gaya"
        },
        {
            "datetime": "27/01/26, 12:22 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "😝"
        },
        {
            "datetime": "27/01/26, 12:22 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Paglll 😂😂😂"
        },
        {
            "datetime": "27/01/26, 12:22 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "For boys ho gage"
        },
        {
            "datetime": "27/01/26, 12:22 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Gaye"
        },
        {
            "datetime": "27/01/26, 12:24 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes yes😁"
        },
        {
            "datetime": "27/01/26, 12:24 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Girls ka anu chalegi kya?"
        },
        {
            "datetime": "27/01/26, 12:24 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Are wo nai hai na"
        },
        {
            "datetime": "27/01/26, 12:24 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Acha"
        },
        {
            "datetime": "27/01/26, 12:24 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Matlab show hai uska"
        },
        {
            "datetime": "27/01/26, 12:25 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yeah, got that"
        },
        {
            "datetime": "27/01/26, 12:26 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "And ye white shirt Wala, his name is Sunny"
        },
        {
            "datetime": "27/01/26, 12:26 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "He edits song"
        },
        {
            "datetime": "27/01/26, 12:26 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yta ke liye karne ka ye"
        },
        {
            "datetime": "27/01/26, 12:26 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Bohot Pehele"
        },
        {
            "datetime": "27/01/26, 1:23 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok ok"
        },
        {
            "datetime": "27/01/26, 4:14 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "https://maps.app.goo.gl/hXiqgXD5aGxhNXss7?g_st=com.google.maps.preview.copy"
        },
        {
            "datetime": "27/01/26, 8:37 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "27/01/26, 8:38 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Acha lag raha hai"
        },
        {
            "datetime": "27/01/26, 8:39 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "yeahhh"
        },
        {
            "datetime": "27/01/26, 8:39 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "👍🏻"
        },
        {
            "datetime": "27/01/26, 8:39 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Dekh finish ho raha hai toh finish karde"
        },
        {
            "datetime": "27/01/26, 8:39 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Kay jyada nai hai unka"
        },
        {
            "datetime": "27/01/26, 8:39 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Easy hai bahot"
        },
        {
            "datetime": "27/01/26, 8:39 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "yeahh"
        },
        {
            "datetime": "27/01/26, 8:40 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha"
        },
        {
            "datetime": "27/01/26, 8:40 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Humara kam kam ho jayega fir kal b sikhana hi padega"
        },
        {
            "datetime": "29/01/26, 2:24 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Me snagitlyawar nigh"
        },
        {
            "datetime": "29/01/26, 2:31 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Okayy"
        },
        {
            "datetime": "29/01/26, 5:42 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "https://www.instagram.com/just__shreeee__?igsh=MTNzdWdkZjY4aWhtNw=="
        },
        {
            "datetime": "29/01/26, 5:42 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "https://www.instagram.com/isthatparii_21?igsh=ZDI5MW93amMxcjE="
        },
        {
            "datetime": "29/01/26, 5:42 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260127-WA0004.jpg (file attached)"
        },
        {
            "datetime": "29/01/26, 5:42 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260127-WA0005.jpg (file attached)"
        },
        {
            "datetime": "29/01/26, 5:42 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Height kam hai iska"
        },
        {
            "datetime": "29/01/26, 5:43 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ye log kya pagal hai kay"
        },
        {
            "datetime": "29/01/26, 5:43 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Pehele nai bol sakte kya"
        },
        {
            "datetime": "29/01/26, 5:43 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Batate time hi sochke"
        },
        {
            "datetime": "29/01/26, 5:43 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Kya bolne ka"
        },
        {
            "datetime": "29/01/26, 5:46 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "5'4"
        },
        {
            "datetime": "29/01/26, 5:46 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Mujhse ek inch chota"
        },
        {
            "datetime": "29/01/26, 5:47 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "What you about the guy, if Animesh not there"
        },
        {
            "datetime": "29/01/26, 5:47 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Nai chota lag raha hai"
        },
        {
            "datetime": "29/01/26, 5:47 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Nai chalega chota"
        },
        {
            "datetime": "30/01/26, 3:20 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I'm up at the studio"
        },
        {
            "datetime": "30/01/26, 3:20 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Just pahuche hun"
        },
        {
            "datetime": "30/01/26, 3:45 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ac ka button direct on kar"
        },
        {
            "datetime": "30/01/26, 3:45 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Remote nai ahe"
        },
        {
            "datetime": "30/01/26, 3:45 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yetoch amhi"
        },
        {
            "datetime": "30/01/26, 3:45 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Sorry late jhale amhala city madhun yayala"
        },
        {
            "datetime": "30/01/26, 5:17 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Nay nay, aaramat ya...🙌🏻"
        },
        {
            "datetime": "31/01/26, 10:16 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "7am?"
        },
        {
            "datetime": "31/01/26, 10:17 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Thoda late rakhte hai"
        },
        {
            "datetime": "31/01/26, 10:17 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Kisiko prb hai"
        },
        {
            "datetime": "31/01/26, 10:17 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Nhi, I said, 7am onwards na"
        },
        {
            "datetime": "31/01/26, 10:18 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "And people have different events after 12"
        },
        {
            "datetime": "31/01/26, 10:18 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ohhh"
        },
        {
            "datetime": "31/01/26, 10:18 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Thik hai"
        },
        {
            "datetime": "31/01/26, 10:18 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan"
        },
        {
            "datetime": "31/01/26, 10:18 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Tho......kaise kare"
        },
        {
            "datetime": "31/01/26, 10:19 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Thik hai 7 ko rakhte hai"
        },
        {
            "datetime": "31/01/26, 10:26 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yess"
        },
        {
            "datetime": "31/01/26, 10:40 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ek band mila hai"
        },
        {
            "datetime": "31/01/26, 11:29 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan kya"
        },
        {
            "datetime": "31/01/26, 1:36 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Mam, vo jo number add Kiya hai, vistaar team mai"
        },
        {
            "datetime": "31/01/26, 1:36 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Nikal do na"
        },
        {
            "datetime": "31/01/26, 1:36 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Galti udher add hua"
        },
        {
            "datetime": "31/01/26, 1:37 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha"
        },
        {
            "datetime": "31/01/26, 11:08 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "https://www.instagram.com/hazel___greenn?igsh=ZmgwNHQyOWczMWtp&utm_source=qr"
        },
        {
            "datetime": "31/01/26, 11:09 pm",
            "sender": "vrohithuta",
            "type": "deleted",
            "text": "You deleted this message"
        },
        {
            "datetime": "31/01/26, 11:09 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "AJ Shreya .vcf (file attached)"
        },
        {
            "datetime": "31/01/26, 11:09 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Ye bandi bohot bhari karti aise divya boli...."
        },
        {
            "datetime": "31/01/26, 11:09 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "She's contacting her"
        },
        {
            "datetime": "31/01/26, 11:54 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260131-WA0029.jpg (file attached)"
        },
        {
            "datetime": "31/01/26, 11:54 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260131-WA0031.jpg (file attached)"
        },
        {
            "datetime": "01/02/26, 5:59 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Arre mami meri jal gayi 30%"
        },
        {
            "datetime": "01/02/26, 5:59 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Abhi hospital main hi hu"
        },
        {
            "datetime": "01/02/26, 5:59 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Main kal raat se yahi hu"
        },
        {
            "datetime": "01/02/26, 5:59 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Gadbad main samjha nahi mujhe tujhe batane ke liye"
        },
        {
            "datetime": "01/02/26, 5:59 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Sunny"
        },
        {
            "datetime": "01/02/26, 6:31 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Bapreeee reeeee"
        },
        {
            "datetime": "01/02/26, 6:31 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Dekhte hai dusraa koi"
        },
        {
            "datetime": "01/02/26, 6:57 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan"
        },
        {
            "datetime": "01/02/26, 6:58 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Reaching in 15 mins"
        },
        {
            "datetime": "01/02/26, 6:58 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Tu kider hai"
        },
        {
            "datetime": "01/02/26, 6:58 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok"
        },
        {
            "datetime": "01/02/26, 5:52 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "Arti Shivam duet v3.mp3 (file attached)"
        },
        {
            "datetime": "02/02/26, 7:10 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "https://maps.app.goo.gl/E52tgVjFHzfcWTyJ7?g_st=com.google.maps.preview.copy"
        },
        {
            "datetime": "02/02/26, 10:58 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Earphones"
        },
        {
            "datetime": "02/02/26, 10:58 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Studio var aahe"
        },
        {
            "datetime": "02/02/26, 10:59 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Tu kuthe ahes"
        },
        {
            "datetime": "02/02/26, 10:59 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ashish che kay jhale"
        },
        {
            "datetime": "02/02/26, 10:59 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Wo kara nai kara"
        },
        {
            "datetime": "02/02/26, 10:59 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I'll call him"
        },
        {
            "datetime": "02/02/26, 10:59 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Uska msg aya hai"
        },
        {
            "datetime": "02/02/26, 11:00 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "On the way"
        },
        {
            "datetime": "02/02/26, 11:00 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I'm calling"
        },
        {
            "datetime": "02/02/26, 11:00 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "You"
        },
        {
            "datetime": "02/02/26, 11:18 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Rohit"
        },
        {
            "datetime": "02/02/26, 11:18 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Call kar na"
        },
        {
            "datetime": "02/02/26, 11:29 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Rohit"
        },
        {
            "datetime": "02/02/26, 11:29 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ashish se bat kar"
        },
        {
            "datetime": "02/02/26, 11:29 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Usko aj sikha de"
        },
        {
            "datetime": "02/02/26, 11:40 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "yes"
        },
        {
            "datetime": "02/02/26, 1:42 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Mujhe call kar"
        },
        {
            "datetime": "02/02/26, 5:05 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "6.30 virag"
        },
        {
            "datetime": "02/02/26, 5:07 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Okay"
        },
        {
            "datetime": "02/02/26, 8:45 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "VID-20260202-WA0030.mp4 (file attached)"
        },
        {
            "datetime": "02/02/26, 8:46 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260202-WA0031.jpg (file attached)"
        },
        {
            "datetime": "03/02/26, 6:03 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Hello bhaiya"
        },
        {
            "datetime": "03/02/26, 6:03 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "So I won’t be able to make it tomorrow… and show ka, I’ll CONFIRM PAKKA 1 pm tak tomorrow"
        },
        {
            "datetime": "03/02/26, 6:03 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "IM SOO SORRY 😭🙏🏻"
        },
        {
            "datetime": "03/02/26, 6:03 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "By saksham"
        },
        {
            "datetime": "03/02/26, 6:04 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Abhi tho possible nay hoga"
        },
        {
            "datetime": "03/02/26, 6:04 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Event date key time aa sakta hu"
        },
        {
            "datetime": "03/02/26, 6:04 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "By Yash"
        },
        {
            "datetime": "03/02/26, 6:25 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Bolaaaa naaa"
        },
        {
            "datetime": "03/02/26, 9:42 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "Ganesh Vandana v2.mp3 (file attached)"
        },
        {
            "datetime": "03/02/26, 9:47 am",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "Bride and groom v5.mp3 (file attached)"
        },
        {
            "datetime": "04/02/26, 7:14 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Rohit tera charger chetak ka mere pass hai"
        },
        {
            "datetime": "04/02/26, 7:14 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Call me"
        },
        {
            "datetime": "04/02/26, 7:27 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "ohhh….."
        },
        {
            "datetime": "04/02/26, 7:31 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hey yes yes"
        },
        {
            "datetime": "04/02/26, 7:31 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "I was in baner"
        },
        {
            "datetime": "04/02/26, 7:31 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "But now leaving"
        },
        {
            "datetime": "04/02/26, 7:31 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Sab thik hai na"
        },
        {
            "datetime": "04/02/26, 11:36 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hai kya pendrive"
        },
        {
            "datetime": "04/02/26, 11:37 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes haan hai"
        },
        {
            "datetime": "04/02/26, 11:37 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "You can send me the tracks"
        },
        {
            "datetime": "04/02/26, 11:41 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok 👍🏻"
        },
        {
            "datetime": "04/02/26, 11:41 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "04/02/26, 11:41 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Group pe dalu"
        },
        {
            "datetime": "04/02/26, 11:41 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "?"
        },
        {
            "datetime": "04/02/26, 11:41 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "However seems fit"
        },
        {
            "datetime": "04/02/26, 11:42 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok 👍🏻"
        },
        {
            "datetime": "05/02/26, 12:04 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "hello maam, kal school karke aate aate mujhe late hoga, bcz rohit nhi hai saathme , I’m coming akele metro se,  , swargate metro se Uber vegarah karke , 1:30-40 ho jayenge !"
        },
        {
            "datetime": "05/02/26, 12:04 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Isse bat nai kiya kya"
        },
        {
            "datetime": "05/02/26, 12:04 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Chikoo ya ashish k sath aa"
        },
        {
            "datetime": "05/02/26, 12:15 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Long story, both are picking Shreya 2 and Divya respectively"
        },
        {
            "datetime": "05/02/26, 12:15 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "And shreya 2 can't come with me subh, she has some work subh subh"
        },
        {
            "datetime": "05/02/26, 12:15 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "And Divya is not picking calls"
        },
        {
            "datetime": "05/02/26, 12:19 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "05/02/26, 12:19 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ohh"
        },
        {
            "datetime": "05/02/26, 12:19 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yeaaaah"
        },
        {
            "datetime": "05/02/26, 12:20 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Thik hai subeh call karke figure out karte hai"
        },
        {
            "datetime": "05/02/26, 12:43 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "06/02/26, 12:29 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "pratiksha bride final surprise act.mp3 (file attached)"
        },
        {
            "datetime": "07/02/26, 4:45 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260207-WA0015.jpg (file attached)"
        },
        {
            "datetime": "07/02/26, 4:47 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hehhehe"
        },
        {
            "datetime": "07/02/26, 4:47 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "More.ash her matlab 😅"
        },
        {
            "datetime": "07/02/26, 4:47 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "*ask her"
        },
        {
            "datetime": "07/02/26, 4:47 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "😂😝 dad being dad"
        },
        {
            "datetime": "07/02/26, 4:47 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hehehe ok ok"
        },
        {
            "datetime": "07/02/26, 4:47 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "🤣"
        },
        {
            "datetime": "07/02/26, 4:48 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Keep it up Rohit"
        },
        {
            "datetime": "07/02/26, 4:48 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "all thanks to you"
        },
        {
            "datetime": "07/02/26, 4:49 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "My pleasure beta ❤️"
        },
        {
            "datetime": "07/02/26, 4:49 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "400 kyu bheja"
        },
        {
            "datetime": "07/02/26, 4:49 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Are"
        },
        {
            "datetime": "07/02/26, 4:49 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "aare mam, class ka"
        },
        {
            "datetime": "07/02/26, 4:49 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Me 100 bhejne wali hu"
        },
        {
            "datetime": "07/02/26, 4:49 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha wahi toh"
        },
        {
            "datetime": "07/02/26, 4:50 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "usme kya…class hi tho liya"
        },
        {
            "datetime": "07/02/26, 4:50 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Tune liya na toh tujhe lena padega"
        },
        {
            "datetime": "07/02/26, 4:50 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ha toh kya hua"
        },
        {
            "datetime": "07/02/26, 4:50 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "aare nhi mam, ittu sa tho tha..."
        },
        {
            "datetime": "07/02/26, 4:50 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "<Media omitted>"
        },
        {
            "datetime": "07/02/26, 4:51 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "B gpay gpay kheltee bethte hai 🤣🤣"
        },
        {
            "datetime": "07/02/26, 4:51 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "😁😁😁😁😝"
        },
        {
            "datetime": "07/02/26, 4:51 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "❤️"
        },
        {
            "datetime": "07/02/26, 4:52 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "thank you."
        },
        {
            "datetime": "07/02/26, 4:52 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes 👍🏻"
        },
        {
            "datetime": "07/02/26, 9:15 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "😁😂"
        },
        {
            "datetime": "08/02/26, 4:40 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Hi, aare mam. Aapka specs banwana hai kya?"
        },
        {
            "datetime": "08/02/26, 4:41 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Just yaad aaya, so conveyed"
        },
        {
            "datetime": "10/02/26, 10:55 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "netsaa.onrender.com"
        },
        {
            "datetime": "10/02/26, 10:56 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "let me know, if free. to call you"
        },
        {
            "datetime": "11/02/26, 12:25 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hua kya"
        },
        {
            "datetime": "11/02/26, 2:12 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Haan mam, just finished, upgraded to a whole new level....achese, jaise aapko samjhega...waise..."
        },
        {
            "datetime": "11/02/26, 2:13 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I'm uploading it to the URL"
        },
        {
            "datetime": "11/02/26, 9:01 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok"
        },
        {
            "datetime": "11/02/26, 7:25 pm",
            "sender": "Pooja Kadam Calling",
            "type": "media",
            "text": "IMG-20260211-WA0025.jpg (file attached)"
        },
        {
            "datetime": "11/02/26, 8:06 pm",
            "sender": "vrohithuta",
            "type": "deleted",
            "text": "You deleted this message"
        },
        {
            "datetime": "11/02/26, 8:07 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260211-WA0028.jpg (file attached)"
        },
        {
            "datetime": "11/02/26, 8:09 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ye wala kal dalti hu"
        },
        {
            "datetime": "11/02/26, 8:09 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Thank you Rohit ❤️"
        },
        {
            "datetime": "11/02/26, 8:09 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "aise hi banaya mai, tp"
        },
        {
            "datetime": "11/02/26, 8:10 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "ek template dikha, tho BANA di😅😝"
        },
        {
            "datetime": "11/02/26, 8:17 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hehhe acha banaya hai"
        },
        {
            "datetime": "11/02/26, 8:17 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "😅"
        },
        {
            "datetime": "12/02/26, 5:06 pm",
            "sender": "vrohithuta",
            "type": "deleted",
            "text": "You deleted this message"
        },
        {
            "datetime": "12/02/26, 5:06 pm",
            "sender": "vrohithuta",
            "type": "deleted",
            "text": "You deleted this message"
        },
        {
            "datetime": "12/02/26, 5:23 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hi Rohit"
        },
        {
            "datetime": "12/02/26, 11:15 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Hi mam"
        },
        {
            "datetime": "12/02/26, 11:15 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Now could you login and try to add the gig."
        },
        {
            "datetime": "12/02/26, 11:15 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Hii"
        },
        {
            "datetime": "12/02/26, 11:15 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ok 👍🏻"
        },
        {
            "datetime": "12/02/26, 11:15 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "netsaa.onrender.com"
        },
        {
            "datetime": "12/02/26, 11:16 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "I hope it may work this time. ACHESE."
        },
        {
            "datetime": "12/02/26, 11:56 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes"
        },
        {
            "datetime": "12/02/26, 11:56 pm",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Rohit kal hume wo edit finish karana hai"
        },
        {
            "datetime": "13/02/26, 12:01 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "Yesss....vo actually jisse video generate ho raha hai, Vo bohot baar fail ho rha hai....aise ruk ruk ke banana pad raha hai"
        },
        {
            "datetime": "13/02/26, 12:05 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Dal diya"
        },
        {
            "datetime": "13/02/26, 12:06 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Ohhhhh kal tak ho jayega na"
        },
        {
            "datetime": "13/02/26, 12:23 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "no issues, while adding the gig ?"
        },
        {
            "datetime": "13/02/26, 12:23 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "HOPING FOR THE BEST. 98% hona chahiye"
        },
        {
            "datetime": "13/02/26, 12:23 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "No no"
        },
        {
            "datetime": "13/02/26, 12:23 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "It was smoot"
        },
        {
            "datetime": "13/02/26, 12:23 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Smooth"
        },
        {
            "datetime": "13/02/26, 12:23 am",
            "sender": "vrohithuta",
            "type": "text",
            "text": "sure ?"
        },
        {
            "datetime": "13/02/26, 7:21 am",
            "sender": "Pooja Kadam Calling",
            "type": "text",
            "text": "Yes yes"
        },
        {
            "datetime": "13/02/26, 10:19 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "VID-20260213-WA0025.mp4 (file attached)"
        },
        {
            "datetime": "13/02/26, 10:24 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "VID-20260213-WA0026.mp4 (file attached)"
        },
        {
            "datetime": "13/02/26, 10:49 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260213-WA0027.jpg (file attached)"
        },
        {
            "datetime": "13/02/26, 10:49 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260213-WA0031.jpg (file attached)"
        },
        {
            "datetime": "13/02/26, 10:49 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260213-WA0030.jpg (file attached)"
        },
        {
            "datetime": "13/02/26, 10:49 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260213-WA0029.jpg (file attached)"
        },
        {
            "datetime": "13/02/26, 10:49 pm",
            "sender": "vrohithuta",
            "type": "media",
            "text": "IMG-20260213-WA0028.jpg (file attached)"
        },
        {
            "datetime": "13/02/26, 10:49 pm",
            "sender": "vrohithuta",
            "type": "text",
            "text": "does that look good?"
        }
    ]


    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-green-600 text-white p-4 font-semibold text-lg">
                    WhatsApp Chat Preview
                </div>

                {/* Messages */}
                <div className="p-4 space-y-3 bg-gray-50">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.side === "right" ? "justify-end" : "justify-start"
                                }`}
                        >
                            <div
                                className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.side === "right"
                                    ? "bg-green-200 text-gray-900 rounded-br-none"
                                    : "bg-white text-gray-800 rounded-bl-none"
                                    }`}
                            >
                                <p className="font-medium text-xs text-gray-500">
                                    {msg.sender}
                                </p>
                                <p className="mt-1">{msg.text}</p>
                                <p className="text-[10px] text-gray-400 mt-2 text-right">
                                    {msg.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Bar */}
                <div className="p-3 border-t flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 rounded-full border text-sm focus:outline-none"
                    />
                    <button className="bg-green-600 text-white px-4 py-2 rounded-full text-sm">
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
