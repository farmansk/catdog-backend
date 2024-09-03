import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
    address: {
        type: String,
        required: true,
        unique: true
    },
    airdropped: {
        type: Boolean,
        default: false
    },
});

export default mongoose.model('user', UserSchema);