# TODO
## Overall
- [ ] Add a profile page to allow users to view and update their profile information. Info such as email, name, password, address, and payment information
  - [ ] We need to add a way to enable MFA on the user account, also
- [ ] Add invoicing and student charging logic - Allow schools to collect payment from students and add charges to their accounts based on what their lessons cost
- [ ] Add a home page
  - [ ] Add a demo flow so new customers can click on a demo button on the home page and view the demo dashboard
  - [ ] Add a “Request more information” button to the home page to allow new customers to request more information from us. This will act as the “Sign Up” button 
- [ ] Verify that the reset password logic is working on the login page
- [ ] Add to the login page a button to “become a customer” or something
- [ ] When a school adds a new user (student, admin, or instructor), we need to add the logic to send them an email to finish signing up and create their user account with their email and password
- [ ] Add a page for schools to add and modify the programs they offer - this is required to add students to a school

## Dashboard
- [ ] We need to get the cards at the top of the page working (Daily Flight Hours, Students in Session, Aircraft utilization, Upcoming flights). Currently, these are dummy data and not tied to any actual information.
- [ ] Improve the map if needed - I think it’s pretty good, but sometimes it doesn’t load all the way, especially on update
- [ ] Verify that “Today’s Flights” is working as expected
- [ ] Verify that “Student Progress” is working as expected

## Flight Log
- [ ] Verify the flight log page is working as expected
  - [ ] View today’s flights (Date is correct)
  - [ ] Add logs for today
  - [ ] Add logs for a future date
  - [ ] Add logs for a past date (Should we add a popup for past dates?)
  - [ ] Filtering is working (We could add a filter by student, plane, and instructor, not just date)
  - [ ] Verify search works
  
## Schedule
- [ ] Verify that the schedule is working as expected
  - [ ] Daily, Weekly, and monthly views are working
  - [ ] Entries are appearing as expected on all three views
  - [ ] Verify we can add, update, and delete a scheduled flight
  - [ ] Verify that when we do update or create a flight, it’s reflected on the flight log as well
  - [ ] Verify filtering is working as expected
## Students
- [ ] Verify the students page is working as expected
  - [ ] All students are appearing (What happens if we have 100s of students?)
  - [ ] Verify we can add a student (When we add a student, we need a way for them to create their user account - I’ve added a task under overall for this)
  - [ ] Progress, flight hours, next milestone, and status are working and updating
- [ ] The individual student’s view is working as expected
  - [ ] Currently, it forwards to notes for some reason.
  - [ ] Verify that the overview is working
  - [ ] The hourly requirements are working
  - [ ] Milestones and stages are working and reflect the program the student is enrolled in
  - [ ] Notes are working
  - [ ] Add a “Charges” or “payments” page so we can track what the student owes the school
    - [ ] This is a rather large task - if we want to accept payment on behalf of the school, it will require integrating with a payment processor and forwarding the money to the school’s account in some way. But this could allow us to take a percentage of this money as a “processing” fee
    - [ ] We will also need to add a way to track and add charges to a student’s account. Based on what? Flight hours, total hours, some usage stats?
## Aircraft
- [ ] Verify all parts of the page are working as expected
- [ ] The cards at the top of the page aren’t working
- [ ] Verify that the fleet overview, Rate management, and maintenance is working
- [ ] Verify that the individual plane info pages are working
  - [ ] “View more” On the maintenance page isn’t working
  - [ ] Rate management has 3: update the rates, add special rates, and “view details.”
  - [ ] The fleet overview has “View Details.”
    - [ ] We could make the “View details” look better; it looks kind of bad
  - [ ] 

## Instructors
- [ ] Get cards at the top of the page working; they are currently using dummy data
- [ ] Verify that the page is working and looks okay
- [ ] There is no individual instructor page? We should have a page to view and edit their information
## Settings
- [ ] Verify that the settings page is working; only the school admin should be able to edit the school information
- [ ] When we add instructors, we need to implement a way for them to create their user accounts. Same with students. Im thinking that when they are added on this page, they are sent an email to “finish signing up.” Then, they create their user account using their email address and password. The trick to this is that we need to ensure we pass the school ID and the student ID/instructor ID to the create account page so they are connected once the user account is created. 
- [ ] Ensure the aircraft tab is functioning; we also need to verify that we can add simulators as planes. This isn’t in place right now
- [ ] There is no “add students” button on the student tab. 
## Login
- [ ] Make sure error codes are displaying correctly, “Invalid password,” etc
- [ ] Add a reset password button and ensure it’s working
- [ ] Make sure MFA is working