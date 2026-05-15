## Introduction
Avolo means "To fly away" in latin and is intended to be the center of a simplifyed open travel planner web application.
It shall give a clear feeling of being centered around the user. This means that efficiency when searching and highlighting best results for the customer is in focus.

UI shall be similar to Typeform with step for step questioning like a dialogue (prompt) to clarify requirements and wishes from the customer. All results shall be bookable with links to external sources. 

The app will be similar to avolo.app in look and style, but will focus on servicing pricings and booking links for: 

1. Flight tickets 
2. Hotel Booking 
3. Car rental 
4. Excursion bookings

The user experience shall be very minimalistic and focus on dialogue with the user, like having a conversation.

## Home
Make an intriguing visual hero section with "Let's Fly Away” text and single search bar with "Plan your next trip" consisting of two Typeform inspired fields: Departure airport and arrival destination.

Below the input fields, add an icon with a microphone and text "Tell me about your dream trip." for conversational input.

Inputs from "Home" will bring the customer to "Explore - Step 2".

Functions:
	1. Select Departure airport.
		a. Autocomplete with cities and airport codes.
		b. Save cities and airports in DB for autocomplete and failover from API.
	2. Select Destination airport
		a. Autocomplete with cities and airport codes.
		b. Save cities and airports in DB for autocomplete and failover from API.

## Explore - Step 1
With searches from "Home", this step is obsolete and needs to be skipped. Step 1 is accessible from main menu "Explore" with the same form and input options as on "Home".

## Explore - Step 2 "How do you want to travel?"
Input from Home / Explore - Step 1, whether it's input fields or spoken input will be streamed as text response on this step 2 for confirmation of choice.

Below streaming, add 4 columns with small button sections with checkboxes for multiple selection:
	- Search flights
	- Book hotel
	- Rent a car
	- Book excursions

These options will take the customer to "Explore - Step 3". 

## Explore - Step 3 - "When do you want to travel?"
Consist of departure dates and return dates.

Functions:
	1. Select type.
		a. One-Way trip
		b. Return trip
	2. Select departure Date
	3. Select Return Date
	4. Flexible Dates
		a. Exact Dates
		b. +/- 1 day (Flexible range)
		c. +/- 3 day (Best value)
		d. +/- 7 day (Maximum savings)
	

## Explore - Step 4 - "Who will be traveling?"
Clarify who is travelling.

Functions:
	1. Number of adults.
	2. Number of children
		a. Age per child
	3. Anyone with dissabilities?

###  Explore - Step 5 - Will you bring luggage?
Clarify luggage for all travellers from "Explore - step 4".

Functions:
	1. Number of hand luggage
	2. Number of checked in luggage
	3. Checkbox with "Any special luggage to check in?" (odd size luggage option)


###  Explore - Results "We found these results for you"?
Depending on selections from step 2, results from search is presented.

A digest for each category shall be presented with these headings on the same page:

	1. Flights
- Present 3 options
		a. Best Choice
		b. Cheapest Option
		c. Shortest Travel Time
	2. Hotels
- Present 3 options
		a. Best overall choice
		b. Cheapest option
		c. Best rating
		d. Most central
	3. Cars
- Present 3 options
		a. Best overall choice
		b. Cheapest option
		c. Closest pickup
		d. Best covered choice
	4. Excursions
	- Present 3 options
		a. Best overall experience
		b. Best must-see experience
		c. Best hidden gems
		d. Best budget option
	
Each category shall have a button with "See more results" that loads another page with a right sidebar with options to filter results after own criterias and update custom choice, then to get back to "Explore - Results". Add pagination for each category and result type page.

## "See more results" - More Filters and options per category
	1. Flight Booking [1 selection is possible per trip]
- If same flight is present from multiple suppliers, present the best option.
		a. Filters to search with:
			i. Departure airport (specific airport or "All" from close proximity): [City / Area]
			ii. Destination: [City / Area]
			iii. Check-in date: [DD.MM.YYYY]
			iv. Check-out date: [DD.MM.YYYY]
			v. Flexibility: [default input from step 3]
			vi. Guests: [default input from step 4]
			vii. Room type: [single / double / family / apartment]
			viii. Priority: [lowest price / best value / lowest risk / location]
		b. Sorting options
			i. Direct flights [Direct / 1-stop / 2+ stops]
			ii. Price [Low to high / High to low (values from results)]
			iii. Travel time [From time / To time (values from results)]
			iv. Travel Type [Hidden-city / Self-transfer / Multi-leg flights (values from results)]
	2. Hotel Booking
- If same hotel is present from multiple suppliers, present the best option.
		a. Filters to search with:
			i. Destination: [Default input from "Home" or "Explore - step 1". Or manual entering City / Area]
			ii. Check-in date: [DD.MM.YYYY]
			iii. Check-out date: [DD.MM.YYYY]
			iv. Flexibility: [input from step 2]
			v. Guests: [input from step 2]
			vi. Room type: [single / double / family / apartment]
			vii. Priority: [lowest price / best value / lowest risk / location]
		b. Sorting options
			i. Total price [all guests, full stay]
			ii. Location [distance to center / key area] 
			iii. Room type [Selection from Step 4.2.f]
			iv. Risk level [] 
			v. Short explanation (why this deal is cheap)
	3. Car rental
- If same car is present from multiple suppliers, present the best option.
		a. Filters to search with:
			i. Location: [Destination airport from step 1 or city / area]
			ii. Pickup date & time: [Arrival time from step 2 plus HH:MM time selector. Default to arrival time + 1 hour]
			iii. Pickup location type: [airport / city center / flexible]
			iv. Drop-off date & time: [Departure time from step 2 plus HH:MM. Default to departure time - 3 hours]
			v. Flexibility: [± hours/days, weekday vs weekend]
			vi. Driver age: [AGE]
			vii. Car type: [economy / compact / SUV / etc.]
			viii. Insurance preference: [basic / full coverage / credit card coverage]
			ix. Priority: [lowest price / best value / lowest risk / convenience]
		b. Sorting options
			i. Total price [High to low / Low to high]
			ii. Pickup location [From / to Distance from step 4.3.c] 
			iii. Insurrance [None / Standard / Full / Premium]
	4. Excursion bookings
	- If same car is present from multiple suppliers, present the best option.
		a. Filters to search with:
			i. Destination: [Destination airport from step 1 or city / area]
			ii. Travel dates: [arrival date and departure date from step 2]
			iii. Flexibility: [± days, time of day, seasonal tolerance]
			iv. Guests: [number + ages]
			v. Preferences: [culture / nature / food / adrenaline / Sport / hidden gems]
			vi. Priority: [lowest price / best value / unique experiences / convenience]
		b. Sorting options
			i. Total price [High to low / Low to high]
			ii. Type [Family Friendly / Couples / Solo]
			iii. Duration [Short trips / Day Trips / Multiple day trips]
			iv. Priority [lowest price / best value / unique experiences / convenience]

## My Trips
Previous searches are stored for logged-in users or stateless in current sessions (30 days cookie).
Results are presented, sorted by search time (newest first)
Each search result shall contain these information on the overview cards:
	1. Destination
	2. Date From / Date To
	3. Search details (smaller details to be visible)
		a. Hotel name (if selected in search)
		b. Car model / name (if selected in search)
		c. Excursions titles (if selected in search)
	4. Total price

Automatically let users refresh each search for updated prices on request.
Ability to edit and remove previous searches from list.
Ability to open trip summary page for each trip.
	

## Travel journal 
Automatically create articles with local images and practical information from the destination cities.
Articles about local considerations containing these topics:
	1. Search field with autocomplete for cities / countries. [Auto-populate with current sessions search destination from Step 1.2]
	2. Article categories
		a. Local recommendations
			i. Special highlights [Link to excursion suggestions at destination]
			ii. What should be avoided [At destination]
			iii. Bad locations [At destination]
			iv. Hidden fees traps [At destination]
			v. Poor value pricing patterns [At destination]
		b. Car Rental
			i. Hidden insurance traps
			ii. Airport fee traps
			iii. Fuel policy scams
			iv. Unrealistic “bait pricing” deals
		
## Search prompts
Use Groq through API and compress and optimize calls to minimize token usage. If free usage and tokens are spend, switch to other mode. Also facilitate Gemini as secondary failover provider, if Groq returns errors when searching.
Use prompts for each search type to ensure that the customer receives the best results and request to optimize results for each customers' search. 

Flight Searches - Prompt & API:
Prompt Location: /source/prompts/prompt_flight_pricing.md
Make connection to selected partners in selected order:
	1. TravelPayouts API
	2. Duffel API
	3. Amadeus API (Disable by default)

Hotel prices searches - Prompt & API:
Prompt Location: /source/prompts/prompt_hotel_pricing.md
Make connection to selected partners in selected order:
	1. TravelPayouts

Car rental searches - Prompt & API:
Prompt Location: /source/prompts/prompt_car_rental_pricing.md
Make connection to selected partners in selected order:
	1. TravelPayouts

### Excursions prices searches - Prompt & API:
Prompt Location: /source/prompts/prompt_excursion_booking.md
Make connection to selected partners in selected order:
	1. TravelPayouts

### "My Trips" 
My Trips saves previous searches. A search can contain a combination of all 4 above booking types combined in a single card per search.
	1. Save searches from current session or for logged-in users
	2. Automatically let users refresh each search for updated prices on request.
Ability to edit and remove previous searches from list.
	3. Ability to open trip summary page for each trip.

### "Profile" to Set standard information for future searches and default settings from the application.

## Sign up as a user with
	1. Email Address / Password
		a. Send magic link by email
		b. Link to setting password on first login (show security of password)
		c. Redirect to "Explore" page upon succesful login
	2. Social logins
		a. Google
			i. Authenticate
			ii. Setting password for profile succesful authentication (show security of password)
			iii. Redirect to "Explore" page upon succesful login
		b. Facebook
			i. Authenticate
			ii. Setting password for profile succesful authentication (show security of password)
			iii. Redirect to "Explore" page upon succesful login
		c. Microsoft
			i. Authenticate
			ii. Setting password for profile succesful authentication (show security of password)
			iii. Redirect to "Explore" page upon succesful login

## Login as user with
	1. Email / Password
		a. Redirect to "Home" page upon succesful login
	2. Social logins
		a. Google
			i. Authenticate
			ii. Redirect to "Explore" page upon succesful login
		b. Facebook
			i. Authenticate
			ii. Redirect to "Explore" page upon succesful login
		c. Microsoft
			i. Authenticate
			ii. Redirect to "Explore" page upon succesful login

## Settings

# Settings(/profile/settings)
	1. Section Header - Basic information
		a. Firstname
		b. Surname
		c. Email address (pre-filled from account)
	2. Section Header - Localization Settings
		a. Currency
			i. EUR (Auto convert rates from source)
			ii. USD (Auto convert rates from source)
			iii. GBP (Auto convert rates from source)
			iv. DKK (Auto convert rates from source)
			v. SEK (Auto convert rates from source)
			vi. NOK (Auto convert rates from source)
		b. Language
			i. English (default)
			ii. German (auto-translate with Google Translate API)
			iii. Dansk (auto-translate with Google Translate API)
			iv. Svensk (auto-translate with Google Translate API)
			v. Norsk (auto-translate with Google Translate API)
		c. Privacy settings
		d. Data export (GDPR)
		e. Account deletion
		
# Preferences (/profile/preferences)
		a. Section Header - "Flight Preferences" (Multiple options possible, none shows all in results)
			i. Default Departure Airports (Ability to set default airport and add 2nd and 3rd choices)
			ii. Flight stops
				1) Direct
				2) 1-stop
				3) 2+ stops
			iii. Travel Type (include)
				1) Hidden-city
				2) Self-transfer
				3) Multi-leg flights
			iv. Cabin class
			v. Max layovers
			vi. Preferred airlines
			vii. Travel style tags (budget, luxury, family)
		b. Section Header - "Hotel preferences"
			i. Star rating
			ii. Amenities (WiFi, breakfast, etc.)
		c. Section Header - "Car preferences"
			i. Type (economy, SUV)
			ii. Transmission
		d. Section Header - "Excursion preferences"
			i. Cultural excursions
			ii. Nature experiences
			iii. Food Experiences
			iv. Adrenaline Trips
			v. Sports Trips
			vi. Hidden gem explorations

# Notifications (/profile/notifications)
	1. Price drop alerts on saved trips
	2. Trip updates
	3. System notifications


An admin user shall also have access to customer demographics, including location, search statistics and other useful metrics. 


## Footer

### Travel Journal
Link to /travel-journal from main menu

### Help / FAQ (/help)
How search aggregation works
Price refresh explanation
Booking via third parties
Trust & transparency

### About (/about)
Mission: customer-first travel
Transparency principles
Privacy Policy
Terms & Conditions

### Contact (/contact)
Support form
Email