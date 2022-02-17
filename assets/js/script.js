
const key = 'c194ee6c634851dfe532cc172dcda633';//API key
const imperial = ["&#176F","MPH",];
const metric = ["&#176C","km/h"]
//variables (M, S, and H are reminders that the different offsets are given/taken in hours, minutes, or seconds)
let city, lat, lon, userDate, userOffsetM, cityDate, cityOffsetS, offsetH, units, unitArr, wind,flag;

//disable enter key function (we use search button only)
document.addEventListener('keypress', function (e) {
    if (e.code == 'Enter' || e.key === 'Enter') {
        e.preventDefault()
        return false
    }
})

//retrieve local storage
if (localStorage.thePlacesIHaveChecked998856==null){
    stored = new Array();
}else{
    stored = JSON.parse(localStorage.thePlacesIHaveChecked998856);
}

//HTML elements
const history = document.getElementById("prevSearches");
const right = document.getElementById("right");
const present = document.getElementById("present");
const futureTitle = document.getElementById("futureTitle");
const futureCards = document.getElementById("futureCards");
const enterCity = document.getElementById("enterCity");
enterCity.value="";
const search = document.getElementById("search");
search.addEventListener("click",getCity);//add search button event listener


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
displayHistory()
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

//functions

function getCity(){
    //get user's date and timezone offset in minutes
    userDate = new Date();
    userOffsetM = -userDate.getTimezoneOffset();//for some reason this is given as a positive number for hours behind GMT
    //get input and continue
    units = document.querySelector('input[name="units"]:checked').value;
    city = enterCity.value;
    cityCoord();
}

//not the most elegant way to do this but it works
function getCityFromHistory(e){
    //get user's date and timezone offset in minutes
    userDate = new Date();
    userOffsetM = -userDate.getTimezoneOffset();//for some reason this is given as a positive number for hours behind GMT
    //get input and continue
    units = document.querySelector('input[name="units"]:checked').value;
    city = e.target.value;
    cityCoord();
}

function cityCoord(){
    enterCity.value="";
    fetch("https://api.openweathermap.org/geo/1.0/direct?q="+city+"&limit=1&appid="+key).then(function (response) {
        return response.json();
    }).then(function (data) {
        //get coordinates 
        lat=data[0].lat;
        lon=data[0].lon;
        //get capitalized place name
        city=data[0].name
        //check if we have the city in our history list
        flag=0;
        for(let c=0;c<stored.length; c++){
            if(stored[c]==city) flag=1;
        }
        //if not then add it
        if(flag==0){
            stored.push(city);//add city to history array
            localStorage.thePlacesIHaveChecked998856=JSON.stringify(stored);//save to local storage
        }
        displayHistory();
        getWeather();
    }).catch(function (){
        //else request a different input
        enterCity.value="";
        enterCity.placeholder="please enter a valid city name";
    });
}

function getWeather(){
    fetch("https://api.openweathermap.org/data/2.5/onecall?lat="+lat+"&lon="+lon+"&units="+units+"&exclude=minutely,hourly,alerts&appid="+key).then(function (response) {
        return response.json();
    }).then(function (data) {
        //get offset of city and calculate present date in specified city
        cityOffsetS=data.timezone_offset;
        offsetH = (cityOffsetS/60 - userOffsetM)/60;
        cityDate = userDate.setHours(userDate.getHours() + offsetH); 
        displayWeather(data);
    }).catch(function (){
        enterCity.value="";
        enterCity.placeholder="no data available for this city";
    });

}

function displayDate(cd){
    let D =new Date();//create new date element
    D.setTime(cd);//set date using passed cityDate
    let dd = String(D.getDate()).padStart(2, '0');
    let mm = String(D.getMonth() + 1).padStart(2, '0'); 
    let yyyy = D.getFullYear();
    let dD = mm + '/' + dd + '/' + yyyy;
    return dD;//return cityDate in required format
}

function increment(cd){
    let D =new Date();//create new date element
    D.setTime(cd);//set date using passed cityDate
    D = D.setHours(D.getHours() + 24);//increment date
    return D//return incremented date
}

function displayWeather(data){
    if(units=="metric"){
        unitArr=metric;//set unit array to metric
        wind=Math.round(data.current.wind_speed*360)/100;//metric wind speed is given by API in m/s, km/h is more intuitive
    }else{
        unitArr=imperial;//or set unit array to imperial
        wind=data.current.wind_speed;
    }
    //display current conditions
    present.children[0].innerHTML=city+" "+displayDate(cityDate)+"<img src='https://openweathermap.org/img/wn/"+data.current.weather[0].icon+"@2x.png'>";
    present.children[1].innerHTML="Temp: "+data.current.temp+unitArr[0];//unitArray[0] and [1] are temperature and speed units
    present.children[2].innerHTML="Wind: "+wind+unitArr[1];
    present.children[3].innerHTML="Humidity: "+data.current.humidity+"%";
    let u=parseFloat(data.current.uvi);
    let col = "rgb("+String(u*25)+","+String(255-u*25)+",100)";//set color for uv index
    present.children[4].innerHTML="UV Index: <span style='border-radius:5px; background-color:"+col+"; color:white; padding-top:5px; padding-bottom:5px; padding-left:10px; padding-right:10px;'>"+u+"</span";

    futureTitle.innerText="5-Day Forecast:";
    //display future conditions
    for(let tt =0; tt<5; tt++){
        if(units=="metric"){
            wind=Math.round(data.daily[tt+1].wind_speed*360)/100;//metric wind speed is given by API in m/s, km/h is more intuitive
        }else{
            wind=data.daily[tt+1].wind_speed;
        }
        cityDate=increment(cityDate);//get next date
        futureCards.children[tt].children[0].innerHTML=displayDate(cityDate);
        futureCards.children[tt].children[1].innerHTML="<img src='https://openweathermap.org/img/wn/"+data.daily[tt+1].weather[0].icon+"@2x.png'>";
        futureCards.children[tt].children[2].innerHTML="Temp: "+data.daily[tt+1].temp.day+unitArr[0];//unitArray[0] and [1] are temperature and speed units
        futureCards.children[tt].children[3].innerHTML="Wind: "+wind+unitArr[1];
        futureCards.children[tt].children[4].innerHTML="Humidity: "+data.daily[tt+1].humidity+"%";
    }
    right.setAttribute("style","visibility:visible");//display info
}

function displayHistory(){
    history.textContent="";
    for(let pc =0;pc<stored.length;pc++ ){
        const hc = document.createElement("button");
        hc.innerText=stored[pc];
        hc.value=stored[pc];
        hc.addEventListener("click",getCityFromHistory);
        hc.setAttribute("class","prevSearch");
        history.appendChild(hc);
    }
    if(stored.length>0){
        const er = document.createElement("button");
        er.innerText="Erase History";
        er.addEventListener("click",eraseHistory);
        er.setAttribute("id","erase")
        history.appendChild(er);
    }
}

function eraseHistory(){
    history.textContent="";
    stored=[];
    localStorage.clear();
}