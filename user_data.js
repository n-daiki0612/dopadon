export class player{
constructor(username){
    this.username = username;
    this.sobi = null;
    this.shojijkin = 0;   
    this.level = 0;
    this.int = 1;
    this.time = 50;
    this.limit = 30;
}
money_add(add){
    this.shojikin = shojikin+add;
}
}


export class fish{
    constructor(name,price,HP,appearance,speed){
        this.name = name;
        this.price = price;
        this.hp = HP;
        this.appea = appearance; //hani
        this.speed = speed;
    }
}

export class tool{
    constructor(name,price,atk,hani){
        this.name = name;
        this.price = price;
        this.atk = atk;
        this.hani = hani;
    }

}