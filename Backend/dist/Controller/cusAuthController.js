import prisma from "../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
//customer registration
export const customerRegister = async (req, res) => {
    try {
        const { name, email, location, password } = req.body;
        console.log("FD: ", name, email, location, password);
        const existingUser = await prisma.customer.findUnique({
            where: { email: email },
        });
        if (existingUser) {
            return res.status(401).json({ message: "User has already registered." });
        }
        //10 mean salt round which make password more safe
        const hashedPassword = await bcrypt.hash(password, 10);
        //data that send to each fields when creating customer
        //select mean return data after creating customer
        const newUser = await prisma.customer.create({
            data: { name, email, location, password: hashedPassword },
            select: { id: true, name: true, email: true },
        });
        //payload contain user id,role and email
        //then secret key used to sign the token
        const token = jwt.sign({ id: newUser.id, role: "customer", email: newUser.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.status(200).json({ user: newUser, token });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error", err });
    }
};
/*
You got this error because TypeScript needs every variable to have one clear structure (type).In your code, you used one variable user for two different things:
A customer record (from prisma.customer.findUnique).A seller record (from prisma.seller.findUnique).But the customer table and the seller table have different fields — for example, a customer has id, name, and email, while a seller has seller_id, businessName, and businessEmail.
So TypeScript becomes confused — it expects user to always have one set of fields, but you are assigning it objects with different shapes.
To fix this, you must tell TypeScript that user can be either a Customer or a Seller.That’s why we define it as a union type:
let user: (Customer & { role: 'customer' }) | (Seller & { role: 'seller' }) | null = null;. This way, TypeScript knows that user might be a Customer or a Seller, and it will check your code accordingly.

1. let user: ... = null;
This declares a variable called user and sets its initial value to null.
The part after the colon (:) tells TypeScript what types the variable can have.

2. (Customer & { role: 'customer' })
This means:
The variable can be a Customer object (from your Prisma model). Plus it must also have a property role with the fixed value 'customer'.
So it’s combining (&) the Customer type and an extra object that adds { role: 'customer' }.

3. (Seller & { role: 'seller' })
This is the same idea, but for the Seller model.It means: The variable can be a Seller object. Plus it must have a property role with the fixed value 'seller'.

4. | (the union operator)
The | means “or” in TypeScript.So the whole type says: "user can be either a Customer with role 'customer', or a Seller with role 'seller', or null."

5. | null
This allows user to be null before you find any record in the database (for example, before login succeeds). In simple words
This line tells TypeScript: "user starts as null, but later it can hold either a customer (with role='customer') or a seller (with role='seller')."

The & (intersection operator)
The & means “combine these two types together.”
So you’re merging all the fields from Seller with all the fields from { role: 'seller' }.

*/
//customer login
export const customerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login request received:", email, password);
        let validUser = null;
        // 1. Check Customer
        const customer = await prisma.customer.findUnique({ where: { email } });
        if (customer && await bcrypt.compare(password, customer.password)) {
            validUser = { ...customer, role: 'customer' };
        }
        // 2. Check Seller (if customer check failed)
        if (!validUser) {
            const seller = await prisma.seller.findUnique({ where: { businessEmail: email } });
            if (seller && await bcrypt.compare(password, seller.password)) {
                validUser = { ...seller, role: 'seller' };
            }
        }
        // 3. Check Charity (if seller check failed)
        if (!validUser) {
            const charity = await prisma.charity.findUnique({ where: { email } });
            if (charity && await bcrypt.compare(password, charity.password)) {
                validUser = { ...charity, role: 'charity' };
            }
        }
        // 4. Check Admin
        if (!validUser) {
            if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
                validUser = { role: 'admin', email };
            }
        }
        if (!validUser) {
            console.log("Login failed: Invalid Credentials or User not found for email:", email);
            return res.status(401).json({ message: "Invalid Credentials or User not found." });
        }
        let user = validUser;
        console.log("Login: Successfully authenticated as role:", user.role);
        const token = jwt.sign({
            id: user.role === 'customer' ? user.id : user.role === 'seller' ? user.seller_id : user.role === 'charity' ? user.id : 'admin',
            role: user.role,
            email: user.role === 'seller' ? user.businessEmail : user.email,
        }, process.env.JWT_SECRET, { expiresIn: "1h" });
        // Return the FULL user object, not just selected fields
        return res.status(200).json({
            token,
            user: user, // <-- Return the complete user object
            message: "User logged in successfully.",
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};
//profile update
export const updateCusProfile = async (req, res) => {
    try {
        const cusId = req.user.id;
        const { name, email, mobileNumber, location, city, zipCode } = req.body;
        console.log("BD: ", name, email, mobileNumber, location, city, zipCode);
        const cusProfileImg = req.file ? req.file.filename : undefined;
        let user = await prisma.customer.findUnique({
            where: { id: cusId },
        });
        if (!user) {
            return res.status(401).json({ message: "User cannot find." });
        }
        //... mean spread operator..It copies the properties in object to another object...combine data
        //name && {name} mean this is logical AND in js.If the name exist it return {name:name}.If it is null it return false
        //in js logical AND return the value of last operand if all operands are true.otherwise it return false
        //select mean the value we wanted to return
        // const updateUser = await prisma.customer.update({
        //     where:{id: cusId},
        //     data: {
        //         ...(name && {name}),
        //         ...(email && {email}),
        //         ...(mobileNumber && {mobileNumber}),
        //         ...(location && {location}),
        //         ...(city && {city}),
        //         ...(zipCode && {zipCode}),
        //         ...(cusProfileImg && {cusProfileImg})
        //     },
        //     select: {name:true,email:true,mobileNumber:true,location:true,city:true,zipCode:true,cusProfileImg:true}
        // })
        const updateUser = await prisma.customer.update({
            where: { id: cusId },
            data: {
                name: name !== undefined ? name : undefined,
                email: email !== undefined ? email : undefined,
                mobileNumber: mobileNumber !== undefined ? mobileNumber : undefined,
                location: location !== undefined ? location : undefined,
                city: city !== undefined ? city : undefined,
                zipCode: zipCode !== undefined ? zipCode : undefined,
                cusProfileImg: cusProfileImg !== undefined ? cusProfileImg : undefined
            },
            select: {
                name: true,
                email: true,
                mobileNumber: true,
                location: true,
                city: true,
                zipCode: true,
                cusProfileImg: true
            }
        });
        console.log("up: ", updateUser);
        return res
            .status(200)
            .json({ updateUser, message: "User update successfully." });
    }
    catch (error) {
        return res.status(500).json({ message: "Server Error." });
    }
};
//get user detail
// get user detail - Fixed version
export const getCusDetail = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const cusId = req.user.id;
        if (!cusId) {
            return res
                .status(401)
                .json({ message: "Invalid token..Please log in again" });
        }
        const customerD = await prisma.customer.findUnique({
            where: { id: cusId },
            select: {
                name: true,
                email: true,
                location: true,
                mobileNumber: true,
                zipCode: true,
                city: true,
                cusProfileImg: true,
            },
        });
        if (!customerD) {
            return res.status(404).json({ message: "Customer not found" });
        }
        console.log("CD: ", customerD);
        // Return the filename as a URL path
        let profileImageUrl = null;
        if (customerD.cusProfileImg) {
            // Add the uploads folder path
            profileImageUrl = `/uploads/${customerD.cusProfileImg}`;
        }
        return res.status(200).json({
            message: "Customer data fetched successfully.",
            customerD: {
                ...customerD,
                cusProfileImg: profileImageUrl, // Send full path instead of just filename
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
