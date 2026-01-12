 import { useNavigation } from '@/components/hooks/providers/useNavigationProvider'
 import { useQueryAuth } from '@/components/hooks/queries/useQueryAuth'

 import AuthForm from '@/components/AuthForm'

 export default function Register() {
   const { register, phase } = useQueryAuth()
   const { navigate } = useNavigation()

   return (
     <AuthForm
       title="Create Account"
       defaultButtonLabel="Create Account"
       linkText="Already have an account? Sign in"
       onLinkClick={() => navigate('/login')}
       mutation={register}
       phase={phase}
     />
   )
 }
