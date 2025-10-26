# **Cost management research**

I’m working on this document to conduct further research into how we can manage students’ costs through our service. 

 ## 1. How to track students’ costs

How do we want to track the costs? Many options are available to us
1. Aircraft rental - per hour - This data is already partly available in the aircraft database; we would need a way to track the student’s hours
2. Instructor time - per hour - This is also already partly in the system, the individual instructors have different costs that we can use to track. 
3. Simulator time - per hour - This is not already in the system but it could operate similar to the way aircraft does, especially if we are just using an aircraft entry for the sim
4. Ground school fees
5. Misc fees

We could implement some sort of tracking based on the length of the students’ flights. This could be used to calculate the total cost of the session

## 2. Processing Payments for Schools

This is an interesting problem; we would need some sort of way to connect the school with the student and process the payment. We could use "Stripe Connect" to collect payments on behalf of other businesses (schools)

* **Stripe Connect** allows you to collect payments on behalf of other businesses.
* Each school becomes a **connected account**.
* Stripe handles payment processing, tax documentation (1099s), and fund routing.

We could set it up using **Express accounts ** to give them a simplified dashboard through Stripe’s UI. This makes the setup and management easier for us. This is similar to how platforms like AirBnB operate. They collect payment on behalf of the renter and then pass the money to the renter’s account. 

## 3. Keeping Track of Student Balances
We would need to develop out own ledger systemm for this; it would include

* **Line-item charges**: Each flight, lesson, fee
* **Payments received**: Synced with Stripe webhooks
* **Running balance**: Charges - payments
* Optional: **Payment plans**, **wallet/prepay credit**, or **auto-pay**

We would need a separate collection in MongoDB for transactions, but the balances could probably be kept in the student collection

