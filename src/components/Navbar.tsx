export const Navbar = () => {
  return (
    <div class="navbar hidden bg-base-300 shadow-sm xl:flex">
      <div class="navbar-start">
        <a class="btn text-xl btn-ghost">AdU-Tutor</a>
      </div>
      <div class="navbar-center">
        <ul class="menu menu-horizontal">
          <li>
            <a>Messages</a>
          </li>
          <li>
            <a>Info Hub</a>
          </li>
        </ul>
      </div>
      <div class="navbar-end">
        <a class="btn">Profile</a>
      </div>
    </div>
  )
}
