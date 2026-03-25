import Time "mo:base/Time";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";

persistent actor {

  // ============ TYPES ============

  public type Role = { #admin; #delivery_boy; #shop };
  public type OrderStatus = { #pending; #accepted; #going_to_shop; #reached_shop; #picked; #delivering; #delivered; #cancelled };
  public type PaymentType = { #cod; #online };

  public type DeliveryBoy = {
    id: Nat;
    name: Text;
    phone: Text;
    email: Text;
    password: Text;
    shiftId: ?Nat;
    isOnline: Bool;
    earnings: Nat;
    codCollected: Nat;
  };

  public type Shop = {
    id: Nat;
    name: Text;
    location: Text;
    email: Text;
    password: Text;
  };

  public type Shift = {
    id: Nat;
    name: Text;
    startTime: Text;
    endTime: Text;
    maxUsers: Nat;
  };

  public type ShiftBooking = {
    id: Nat;
    deliveryBoyId: Nat;
    shiftId: Nat;
  };

  public type Order = {
    id: Nat;
    shopId: Nat;
    deliveryBoyId: ?Nat;
    customerName: Text;
    phone: Text;
    address: Text;
    items: Text;
    status: OrderStatus;
    paymentType: PaymentType;
    amount: Nat;
    deliveryCharge: Nat;
    createdAt: Int;
  };

  public type DashboardStats = {
    totalOrders: Nat;
    deliveredOrders: Nat;
    pendingOrders: Nat;
    activeOrders: Nat;
    onlineDeliveryBoys: Nat;
    totalDeliveryBoys: Nat;
    totalEarnings: Nat;
  };

  public type LoginResult = {
    #ok: { role: Role; userId: Nat; name: Text };
    #err: Text;
  };

  // ============ STATE ============

  var deliveryBoys : [DeliveryBoy] = [];
  var shops : [Shop] = [];
  var shifts : [Shift] = [];
  var shiftBookings : [ShiftBooking] = [];
  var orders : [Order] = [];
  var nextDeliveryBoyId : Nat = 1;
  var nextShopId : Nat = 1;
  var nextShiftId : Nat = 1;
  var nextBookingId : Nat = 1;
  var nextOrderId : Nat = 1;
  var defaultDeliveryCharge : Nat = 30;

  // ============ AUTH / LOGIN ============

  public query func login(email: Text, password: Text) : async LoginResult {
    if (email == "thoufeeq2mohd@gmail.com" and password == "trencart@123") {
      return #ok({ role = #admin; userId = 0; name = "Admin" });
    };
    for (db in deliveryBoys.vals()) {
      if (db.email == email and db.password == password) {
        return #ok({ role = #delivery_boy; userId = db.id; name = db.name });
      };
    };
    for (s in shops.vals()) {
      if (s.email == email and s.password == password) {
        return #ok({ role = #shop; userId = s.id; name = s.name });
      };
    };
    #err("Invalid email or password");
  };

  // ============ DELIVERY BOY CRUD ============

  public func addDeliveryBoy(name: Text, phone: Text, email: Text, password: Text) : async Nat {
    let id = nextDeliveryBoyId;
    nextDeliveryBoyId += 1;
    let db : DeliveryBoy = { id; name; phone; email; password; shiftId = null; isOnline = false; earnings = 0; codCollected = 0 };
    deliveryBoys := Array.append(deliveryBoys, [db]);
    id;
  };

  public func updateDeliveryBoy(id: Nat, name: Text, phone: Text, email: Text) : async Bool {
    var found = false;
    deliveryBoys := Array.map(deliveryBoys, func(db: DeliveryBoy) : DeliveryBoy {
      if (db.id == id) { found := true; { db with name; phone; email } } else db;
    });
    found;
  };

  public func deleteDeliveryBoy(id: Nat) : async Bool {
    let before = deliveryBoys.size();
    deliveryBoys := Array.filter(deliveryBoys, func(db: DeliveryBoy) : Bool { db.id != id });
    deliveryBoys.size() < before;
  };

  public query func getDeliveryBoys() : async [DeliveryBoy] { deliveryBoys };

  public query func getDeliveryBoy(id: Nat) : async ?DeliveryBoy {
    Array.find(deliveryBoys, func(db: DeliveryBoy) : Bool { db.id == id });
  };

  public func setDeliveryBoyOnline(id: Nat, isOnline: Bool) : async Bool {
    var found = false;
    deliveryBoys := Array.map(deliveryBoys, func(db: DeliveryBoy) : DeliveryBoy {
      if (db.id == id) { found := true; { db with isOnline } } else db;
    });
    found;
  };

  // ============ SHOP CRUD ============

  public func addShop(name: Text, location: Text, email: Text, password: Text) : async Nat {
    let id = nextShopId;
    nextShopId += 1;
    let s : Shop = { id; name; location; email; password };
    shops := Array.append(shops, [s]);
    id;
  };

  public func updateShop(id: Nat, name: Text, location: Text, email: Text) : async Bool {
    var found = false;
    shops := Array.map(shops, func(s: Shop) : Shop {
      if (s.id == id) { found := true; { s with name; location; email } } else s;
    });
    found;
  };

  public func deleteShop(id: Nat) : async Bool {
    let before = shops.size();
    shops := Array.filter(shops, func(s: Shop) : Bool { s.id != id });
    shops.size() < before;
  };

  public query func getShops() : async [Shop] { shops };

  // ============ SHIFT CRUD ============

  public func addShift(name: Text, startTime: Text, endTime: Text, maxUsers: Nat) : async Nat {
    let id = nextShiftId;
    nextShiftId += 1;
    let sh : Shift = { id; name; startTime; endTime; maxUsers };
    shifts := Array.append(shifts, [sh]);
    id;
  };

  public func updateShift(id: Nat, name: Text, startTime: Text, endTime: Text, maxUsers: Nat) : async Bool {
    var found = false;
    shifts := Array.map(shifts, func(sh: Shift) : Shift {
      if (sh.id == id) { found := true; { id; name; startTime; endTime; maxUsers } } else sh;
    });
    found;
  };

  public func deleteShift(id: Nat) : async Bool {
    let before = shifts.size();
    shifts := Array.filter(shifts, func(sh: Shift) : Bool { sh.id != id });
    shifts.size() < before;
  };

  public query func getShifts() : async [Shift] { shifts };

  // ============ SHIFT BOOKINGS ============

  public func bookShift(deliveryBoyId: Nat, shiftId: Nat) : async Bool {
    let exists = Array.find(shiftBookings, func(b: ShiftBooking) : Bool {
      b.deliveryBoyId == deliveryBoyId and b.shiftId == shiftId;
    });
    switch (exists) {
      case (?_) { return false; };
      case (null) {};
    };
    let shiftOpt = Array.find(shifts, func(s: Shift) : Bool { s.id == shiftId });
    switch (shiftOpt) {
      case (null) { return false; };
      case (?sh) {
        let count = Array.filter(shiftBookings, func(b: ShiftBooking) : Bool { b.shiftId == shiftId }).size();
        if (count >= sh.maxUsers) { return false; };
      };
    };
    let id = nextBookingId;
    nextBookingId += 1;
    shiftBookings := Array.append(shiftBookings, [{ id; deliveryBoyId; shiftId }]);
    deliveryBoys := Array.map(deliveryBoys, func(db: DeliveryBoy) : DeliveryBoy {
      if (db.id == deliveryBoyId) { { db with shiftId = ?shiftId } } else db;
    });
    true;
  };

  public func cancelShiftBooking(deliveryBoyId: Nat, shiftId: Nat) : async Bool {
    let before = shiftBookings.size();
    shiftBookings := Array.filter(shiftBookings, func(b: ShiftBooking) : Bool {
      not (b.deliveryBoyId == deliveryBoyId and b.shiftId == shiftId)
    });
    if (shiftBookings.size() < before) {
      deliveryBoys := Array.map(deliveryBoys, func(db: DeliveryBoy) : DeliveryBoy {
        if (db.id == deliveryBoyId) { { db with shiftId = null } } else db;
      });
      true;
    } else false;
  };

  public query func getBookingsForDeliveryBoy(deliveryBoyId: Nat) : async [ShiftBooking] {
    Array.filter(shiftBookings, func(b: ShiftBooking) : Bool { b.deliveryBoyId == deliveryBoyId });
  };

  public query func getBookingsForShift(shiftId: Nat) : async [ShiftBooking] {
    Array.filter(shiftBookings, func(b: ShiftBooking) : Bool { b.shiftId == shiftId });
  };

  // ============ ORDERS ============

  public func createOrder(shopId: Nat, customerName: Text, phone: Text, address: Text, items: Text, paymentType: PaymentType, amount: Nat) : async Nat {
    let id = nextOrderId;
    nextOrderId += 1;
    let o : Order = {
      id; shopId;
      deliveryBoyId = null;
      customerName; phone; address; items;
      status = #pending;
      paymentType; amount;
      deliveryCharge = defaultDeliveryCharge;
      createdAt = Time.now();
    };
    orders := Array.append(orders, [o]);
    id;
  };

  public func assignDeliveryBoy(orderId: Nat, deliveryBoyId: Nat) : async Bool {
    var found = false;
    orders := Array.map(orders, func(o: Order) : Order {
      if (o.id == orderId) { found := true; { o with deliveryBoyId = ?deliveryBoyId } } else o;
    });
    found;
  };

  public func updateOrderStatus(orderId: Nat, status: OrderStatus) : async Bool {
    var found = false;
    var assignedDbId : ?Nat = null;
    var charge : Nat = 0;
    var payType : PaymentType = #online;
    var amt : Nat = 0;
    orders := Array.map(orders, func(o: Order) : Order {
      if (o.id == orderId) {
        found := true;
        assignedDbId := o.deliveryBoyId;
        charge := o.deliveryCharge;
        payType := o.paymentType;
        amt := o.amount;
        { o with status };
      } else o;
    });
    if (found) {
      switch (status) {
        case (#delivered) {
          switch (assignedDbId) {
            case (?dbId) {
              deliveryBoys := Array.map(deliveryBoys, func(db: DeliveryBoy) : DeliveryBoy {
                if (db.id == dbId) {
                  let newCod = switch (payType) {
                    case (#cod) db.codCollected + amt;
                    case (_) db.codCollected;
                  };
                  { db with earnings = db.earnings + charge; codCollected = newCod };
                } else db;
              });
            };
            case (null) {};
          };
        };
        case (_) {};
      };
    };
    found;
  };

  public query func getOrders() : async [Order] { orders };

  public query func getOrdersForShop(shopId: Nat) : async [Order] {
    Array.filter(orders, func(o: Order) : Bool { o.shopId == shopId });
  };

  public query func getOrdersForDeliveryBoy(deliveryBoyId: Nat) : async [Order] {
    Array.filter(orders, func(o: Order) : Bool {
      switch (o.deliveryBoyId) {
        case (?dbId) dbId == deliveryBoyId;
        case (null) false;
      };
    });
  };

  // ============ SETTINGS ============

  public func setDeliveryCharge(amount: Nat) : async () {
    defaultDeliveryCharge := amount;
  };

  public query func getDeliveryCharge() : async Nat { defaultDeliveryCharge };

  // ============ DASHBOARD ============

  public query func getDashboardStats() : async DashboardStats {
    let totalOrders = orders.size();
    let deliveredOrders = Array.filter(orders, func(o: Order) : Bool { o.status == #delivered }).size();
    let pendingOrders = Array.filter(orders, func(o: Order) : Bool { o.status == #pending }).size();
    let activeOrders = Array.filter(orders, func(o: Order) : Bool {
      o.status != #pending and o.status != #delivered and o.status != #cancelled;
    }).size();
    let onlineDeliveryBoys = Array.filter(deliveryBoys, func(db: DeliveryBoy) : Bool { db.isOnline }).size();
    let totalDeliveryBoys = deliveryBoys.size();
    var totalEarnings : Nat = 0;
    for (db in deliveryBoys.vals()) { totalEarnings += db.earnings; };
    { totalOrders; deliveredOrders; pendingOrders; activeOrders; onlineDeliveryBoys; totalDeliveryBoys; totalEarnings };
  };

};
