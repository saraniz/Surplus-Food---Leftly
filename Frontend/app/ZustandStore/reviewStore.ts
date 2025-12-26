import {create} from 'zustand'
import api from '../libs/api'

interface Review {
  reviewId: number;
  rating: number;
  message: string;
  createdAt: string;
  customer: {
    name: string;
  };
}


interface ReviewState{
    review: Review[]
    token: string | null
    loading: boolean
    error: string | null

    postReview: (productId:number,message:string,rating:number) => Promise<void>
    getReviews: (productId:number) => Promise<void>
}

export const useReviewStore = create<ReviewState>((set,get) => ({
    review: [],
    token: localStorage.getItem("token"),
    loading:false,
    error:null,

    postReview: async (productId,message,rating?) => {

        console.log("DR: ",productId,message,rating)

        try{
            set({loading:true, error:null})

            const token = localStorage.getItem("token")

            const res = await api.post(`/api/review/postreview/${productId}`,
                {message,rating},
                {headers: {Authorization: `Bearer ${token}`}}
            )

            console.log(res)

            set((state) => ({
  review: [...state.review, res.data.review],
  loading: false,
}));

        } catch(err:any){
            set({error:err?.message ?? "Review added failed"})
        }

    },

    getReviews: async (productId) => {

        try{
            set({loading:true, error:null})

            const res = await api.get(`/api/review/getreviews/${productId}`)

            console.log(res)

            set({review:res.data.reviews, loading:false})
        } catch(err:any){
            set({error:err?.message ?? "Review fetched failed"})
        }
    },


}))