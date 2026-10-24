export class player{
constructor(username){
    this.username = username;
    this.sobi = [];
    this.shojijkin = 0;   
    this.level = 0
    this.limit = 30
}
money_add(add){
    this.shojikin = shojikin+add;
}
money_down(down){
    this.shojikin = shojikin + down;
}
sobi_add(sobi){
    this.sobi.push(sobi)
}

}


export class fish{
    constructor(name,price,HP,appearance,speed){
        this.name = name;//
        this.price = price;
        this.hp = HP;
        this.appea = appearance; //出現率
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