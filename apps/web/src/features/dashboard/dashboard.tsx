import { Button } from '@/components/ui/button'
import { useLogout } from '../auth/hooks/use-logout'

const Dashboard = () => {

  const { mutate } = useLogout()

  return (
    <div className='p-4'>
      <Button onClick={() => mutate()} title='Logout'>
        Logout
      </Button>
    </div>
  )
}

export default Dashboard
