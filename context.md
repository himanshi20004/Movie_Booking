Himanshi Jaiswal - Round 2 

Movie ticket booking - bookmyshow. 

Requirement: 

It should list down all the movies that is currently in the city , region , theatre
It should take of the seats availability 
It should handle the thing:before book a seat, if this seat is already occupied or when the payment get confiremd, then it should make that seat unavailable, 
If payment get cancelled, then should make that occupied seat available
It should also be connected to notification , 
Handle the discount coupons etc. 

List down the movies in the city-> locality->particular theatre ,
Language, 2D-3D

dataModels:
Movie(id,name,duration, cost,language,2D/3D,theatres)
Theatre(id,name,location, ref:Movie)
Theatre_seats(theatre_id,movie_id,Seats[])
seats(movie_id,theatre_id,row,column,AVAILABLE/BOOKED,price,user_id)
user(id,name)

List down movie->by the app
Users: search (get movie list)-> checking seat availability-> selection of seats->// booking of movie-> payment service-> deduction of that movie seat (mark BOOKED)//->notify to user


